---
sidebar_position: 5
---

# [go.dev] 泛型使用時機

> 非原創內容，來源為 Ian Lance Taylor 於 2022 年 4 月 12 日的文章 [When To Use Generics](https://go.dev/blog/when-generics)，如有版權問題，請告知，將會立即刪除。

## 介紹

原作者 Ian Lance Taylor 在 Google Open Source Live 上的分享。
<iframe width="560" height="315" src="https://www.youtube.com/embed/nr8EpUO9jhw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

Go 1.18 版本新增了一個重大的新語言功能：支援泛型程式設計。在本文中，我不會描述泛型是什麼，也不會描述如何使用它們。本文是關於何時在 Go 程式碼中使用泛型，以及何時不要使用它們。

為了清楚起見，我將提供通用的指引，而不是硬性規定。請自行判斷。但如果你不確定，我建議使用這裡討論到的指引。

## 撰寫程式碼

讓我們從通用的 Go 程式設計指引開始：透過撰寫程式碼來撰寫 Go 程式，而不是透過定義型別。當談到泛型時，如果你一開始就以定義型別參數的約束來撰寫程式，你可能走錯路了。從撰寫函數開始，當明確知道型別參數會有用時，稍後再加入它是很容易的。

## 何時型別參數會有用？

讓我們看看型別參數有用的情況。

### 當使用語言定義的容器型別時

一種情況是當撰寫函數時，它會操作語言定義的特殊容器型別：切片、映射和通道。如果函數具有這些型別的參數，並且函數程式碼不會對元素型別做出任何特定的假設，那麼使用型別參數可能會很有用。

例如，這是一個函數，它會傳回任何型別的映射中所有鍵的切片：

```go
// MapKeys returns a slice of all the keys in m.
// The keys are not returned in any particular order.
func MapKeys[Key comparable, Val any](m map[Key]Val) []Key {
    s := make([]Key, 0, len(m))
    for k := range m {
        s = append(s, k)
    }
    return s
}
```

這段程式碼不會對映射鍵型別做任何假設，也不會使用映射值型別。它適用於任何映射型別。這使它成為使用型別參數的優秀候選者。

這種函數的替代方法通常是使用反射，但這是一種更笨拙的程式設計模型，並且在建置時不會在靜態類型檢查，而且在執行時通常會更慢。

以下是使用反射的範例：
```go
// MapKeys returns a slice of all the keys in m.
// The keys are not returned in any particular order.
func MapKeys(m interface{}) []interface{} {
    v := reflect.ValueOf(m)
    if v.Kind() != reflect.Map {
        panic("not a map")
    }
    s := make([]interface{}, 0, v.Len())
    for _, k := range v.MapKeys() {
        s = append(s, k.Interface())
    }
    return s
}
```

### 通用的資料結構

另一種型別參數可能有用的情況是通用的資料結構。通用的資料結構是像切片或映射這樣的東西，但它不是內建到語言中的，例如鏈結串列或二元樹。

今天，需要這種資料結構的程式通常會做以下兩件事之一：使用特定的元素型別撰寫它們，或使用介面型別。將特定的元素型別替換為型別參數可以產生一個更通用的資料結構，該資料結構可以在程式的其他部分或其他程式中使用。將介面型別替換為型別參數可以允許以更有效的方式儲存資料，節省記憶體資源；它還可以允許程式碼避免型別斷言，並在建置時完全進行型別檢查。

例如，這是使用型別參數的二元樹資料結構的部分內容：

```go
// Tree is a binary tree.
type Tree[T any] struct {
    cmp func(T, T) int
    root *node[T]
}

// A node in a Tree.
type node[T any] struct {
    left, right  *node[T]
    val          T
}

// find returns a pointer to the node containing val,
// or, if val is not present, a pointer to where it
// would be placed if added.
func (bt *Tree[T]) find(val T) **node[T] {
    pl := &bt.root
    for *pl != nil {
        // highlight-next-line
        switch cmp := bt.cmp(val, (*pl).val); {
        case cmp < 0:
            pl = &(*pl).left
        case cmp > 0:
            pl = &(*pl).right
        default:
            return pl
        }
    }
    return pl
}

// Insert inserts val into bt if not already there,
// and reports whether it was inserted.
func (bt *Tree[T]) Insert(val T) bool {
    pl := bt.find(val)
    if *pl != nil {
        return false
    }
    *pl = &node[T]{val: val}
    return true
}
```

樹的每個節點都包含型別參數 T 的值。當樹以特定的型別參數實例化時，該型別的值將直接儲存在節點中。它們不會以介面型別儲存。

這是型別參數的合理使用，因為樹資料結構（包括方法中的程式碼）在很大程度上與元素型別 T 無關。

樹資料結構確實需要知道如何比較元素型別 T 的值；它使用傳入的比較函數來做到這一點。你可以在 find 方法的第四行看到呼叫 bt.cmp。除此之外，型別參數完全沒有任何作用。

### 為了型別參數，優先使用函數而不是方法

樹的範例說明了另一個通用的指引：當你需要像比較函數這樣的東西時，優先使用函數而不是方法。

我們可以定義 Tree 型別，使元素型別需要有 Compare 或 Less 方法。這可以透過撰寫一個需要該方法的約束來完成，這意味著用於實例化 Tree 型別的任何型別參數都需要該方法。

結果是，任何想要使用 Tree 與像 int 這樣的簡單資料型別的人都必須定義自己的整數型別並撰寫自己的比較方法。如果我們定義 Tree 採用比較函數，如上面的程式碼所示，那麼傳入所需的函數就很容易。撰寫該比較函數與撰寫方法一樣容易。

如果 Tree 元素型別碰巧已經有 Compare 方法，那麼我們可以簡單地使用像 ElementType.Compare 這樣的方法表達式作為比較函數。

換句話說，將方法轉換為函數比將方法添加到型別簡單得多。因此，對於通用資料型別，優先使用函數而不是撰寫需要方法的約束。

### 實作共用的方法

另一種型別參數可能有用的情況是不同型別需要實作某些共用的方法，而且不同型別的實作看起來都一樣。

例如，考慮標準函數庫的 sort.Interface。它要求型別實作三個方法：Len、Swap 和 Less。

這是一個泛型型別 SliceFn 的範例，它為任何切片型別實作 sort.Interface：

```go
// SliceFn implements sort.Interface for a slice of T.
type SliceFn[T any] struct {
    s    []T
    less func(T, T) bool
}

func (s SliceFn[T]) Len() int {
    return len(s.s)
}

func (s SliceFn[T]) Swap(i, j int) {
    s.s[i], s.s[j] = s.s[j], s.s[i]
}

func (s SliceFn[T]) Less(i, j int) bool {
    return s.less(s.s[i], s.s[j])
}
```

對於任何切片型別，Len 和 Swap 方法都完全相同。Less 方法需要一個比較，這是 SliceFn 名稱中 Fn 部分的意思。與前面的 Tree 範例一樣，我們將在建立 SliceFn 時傳入一個函數。

這是如何使用比較函數使 SliceFn 排序任何切片：

```go
// SortFn sorts s in place using a comparison function.
func SortFn[T any](s []T, less func(T, T) bool) {
    sort.Sort(SliceFn[T]{s, less})
}
```

這與標準函數庫函數 sort.Slice 相似，但比較函數是使用值而不是切片索引撰寫的。

使用型別參數來撰寫這種程式碼是合適的，因為所有切片型別的方法看起來都完全一樣。

（我應該提到，Go 1.19– 而不是 1.18– 很可能會包含一個使用比較函數來排序切片的泛型函數，而且該泛型函數很可能不會使用 sort.Interface。請參閱[提案 #47619](https://github.com/golang/go/issues/47619)。但是即使這個特定的範例很可能不會有用，一般的觀點仍然是正確的：當你需要實作對所有相關型別來說看起來都一樣的方法時，使用型別參數是合理的。）

## 何時型別參數沒有用？

現在讓我們談談另一面向的問題：何時不要使用型別參數。

### 不要用型別參數取代介面型別

我們都知道，Go 有介面型別。介面型別允許一種泛型程式設計。

例如，廣泛使用的 io.Reader 介面提供了一種通用機制，用於從包含資訊的任何值（例如檔案）或產生資訊的任何值（例如隨機數產生器）讀取資料。如果你需要做的是呼叫某種型別的值上的方法，請使用介面型別，而不是型別參數。io.Reader 容易閱讀、高效且有效。沒有必要使用型別參數來透過呼叫 Read 方法從值中讀取資料。

例如，可能會誘惑你將此處的第一個函數特徵（僅使用介面型別）更改為第二個版本（使用型別參數）。

```go
func ReadSome(r io.Reader) ([]byte, error)

func ReadSome[T io.Reader](r T) ([]byte, error)
```

不要做這種更改。省略型別參數會使函數更容易撰寫、更容易閱讀，並且執行時間可能相同。

值得強調最後一點。雖然有可能以幾種不同的方式實作泛型，而且實作會隨著時間的推移而改變和改進，但在 Go 1.18 中使用的實作在許多情況下會像介面型別一樣處理型別參數的值。這意味著使用型別參數通常不會比使用介面型別更快。因此，不要只為了速度而從介面型別更改為型別參數，因為它可能不會運行得更快。

### 如果方法實作不同，請不要使用型別參數

在決定使用型別參數還是介面型別時，請考慮方法的實作。前面我們說過，如果方法的實作對所有型別都相同，請使用型別參數。相反地，如果實作對每種型別都不同，則使用介面型別並撰寫不同的方法實作，而不要使用型別參數。

例如，從檔案讀取的實作與從隨機數產生器讀取的實作完全不同。這意味著我們應該撰寫兩個不同的 Read 方法，並使用像 io.Reader 這樣的介面型別。

### 合適時使用反射

Go 具有[執行時反射](https://pkg.go.dev/reflect)。反射允許一種泛型程式設計，因為它允許你撰寫可以與任何型別一起使用的程式碼。

如果某些操作必須支援甚至沒有方法的型別（因此介面型別無法幫助），並且如果該操作對每種型別都不同（因此型別參數不適用），請使用反射。

這的一個範例是 [encoding/json](https://pkg.go.dev/encoding/json) 套件。我們不想要求我們編碼的每種型別都有一個 MarshalJSON 方法，因此我們不能使用介面型別。但是編碼一個介面型別與編碼一個結構型別完全不同，因此我們不應該使用型別參數。相反，該套件使用反射。程式碼並不簡單，但它可以運作。詳情請[參閱原始碼](https://go.dev/src/encoding/json/encode.go)。

## 一個簡單的指引

總之，這個關於何時使用泛型的討論可以縮減為一個簡單的指引。

如果你發現自己撰寫了完全相同的程式碼多次，而這些程式碼之間唯一的差異是程式碼使用不同的型別，請思考是否可以使用型別參數。

另一種說法是，除非你注意到你即將撰寫完全相同的程式碼多次，否則應該避免使用型別參數。

## 內容來源

- [when-generics](https://go.dev/blog/when-generics)
