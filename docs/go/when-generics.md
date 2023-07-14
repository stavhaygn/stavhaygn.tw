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

## 什麼時候型別參數會有用？

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

## 內容來源

- [when-generics](https://go.dev/blog/when-generics)
