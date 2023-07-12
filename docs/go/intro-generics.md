---
sidebar_position: 4
---

# [go.dev] 介紹泛型

> 非原創內容，來源為 Robert Griesemer 與 Ian Lance Taylor 於 2022 年 3 月 22 日的文章 [An Introduction To Generics](https://go.dev/blog/intro-generics)，如有版權問題，請告知，將會立即刪除。

## 介紹

Go 1.18 版本新增了對泛型的支援。泛型是自從第一個開源版本以來，我們對 Go 所做的最大改變。在本文中，我們將介紹新的語言功能。我們不會試圖涵蓋所有細節，但我們會觸及所有重要的點。有關更詳細和更長的說明，包括許多示例，請參閱[提案文件](https://go.googlesource.com/proposal/+/HEAD/design/43651-type-parameters.md)。有關語言更改的更精確描述，請參閱[更新的語言規範](https://go.dev/ref/spec)。（請注意，實際的 1.18 實現對提案文件允許的內容施加了一些限制；規範應該是準確的。未來的版本可能會解除某些限制。）

泛型是一種撰寫與正在使用的特定型別無關的程式碼的方法。現在可以撰寫函數和型別來使用任何一組型別。

泛型為語言增加了三個新的大功能：

- 函數和型別的型別參數。
- 將介面型別定義為型別集，包括沒有方法的型別。
- 型別推論，允許在許多情況下在呼叫函數時省略型別參數。

## 型別參數

函數和型別現在允許有型別參數。型別參數串列看起來像一般的參數串列，只是它使用方括號而不是圓括號。

To show how this works, let’s start with the basic non-generic Min function for floating point values:

為了展示這是如何運作的，讓我們從基本的非泛型 Min 函數開始，用於浮點值：

```go
func Min(x, y float64) float64 {
    if x < y {
        return x
    }
    return y
}
```

我們可以透過添加型別參數串列來使此函數成為泛型，使其適用於不同的型別。在此範例中，我們添加了一個帶有單個型別參數 T 的型別參數串列，並將 float64 的使用替換為 T。

```go
import "golang.org/x/exp/constraints"

func GMin[T constraints.Ordered](x, y T) T {
    if x < y {
        return x
    }
    return y
}
```

現在可以透過撰寫像這樣的方式來使用型別引數呼叫此函數

```go
x := GMin[int](3, 4)
```

提供型別引數給 GMin，例如 int，稱為實例化。實例化分為兩個步驟。首先，編譯器會在整個泛型函數或型別中將所有型別引數替換為其各自的型別參數。其次，編譯器會驗證每個型別引數是否滿足各自的約束。我們很快就會知道這是什麼意思，但如果第二步失敗，實例化將失敗，並且程式無效。

實例化成功後，我們有一個非泛型函數，可以像任何其他函數一樣呼叫。例如，在像這樣的程式碼中

```go
fmin := GMin[float64]
m := fmin(2.71, 3.14)
```

實例化 GMin[float64] 產生的實際上是我們原來的浮點 Min 函數，我們可以在函數呼叫中使用它。

型別參數也可以與型別一起使用。

```go
type Tree[T interface{}] struct {
    left, right *Tree[T]
    value T
}

func (t *Tree[T]) Lookup(x T) *Tree[T] { ... }

var stringTree Tree[string]
```

在這裡，泛型型別 Tree 儲存型別參數 T 的值。泛型型別可以有方法，例如此範例中的 Lookup。為了使用泛型型別，必須對其進行實例化；Tree[string] 是使用型別引數 string 實例化 Tree 的範例。

## 型別集

讓我們更深入地研究一下可以用來實例化型別參數的型別引數。

一個普通的函數對於每個值參數都有一個型別；該型別定義了一組值。例如，如果我們有一個 float64 型別，如上面的非泛型函數 Min，則引數值的可允許的集合，是可以由 float64 型別表示的浮點值集合。

同樣地，型別參數串列對於每個型別參數都有一個型別。因為型別參數本身就是一種型別，所以型別參數的型別定義了一組型別。這種元型別稱為型別約束。

在泛型 GMin 中，型別約束是從 [constraints 套件](https://pkg.go.dev/golang.org/x/exp/constraints)匯入。Ordered 約束描述了所有具有可排序值的型別集，換句話說，可使用 < 運算子（或 <=，> 等）進行比較。約束確保只有具有可排序值的型別才能傳遞給 GMin。這也意味著在 GMin 函數主體中，可以使用該型別參數的值與 < 運算子進行比較。

在 Go 中，型別約束必須是介面。也就是說，介面型別可以用作值型別，也可以用作元型別。介面定義方法，因此我們可以表達需要存在某些方法的型別約束。但是，constraints.Ordered 也是介面型別，< 運算子不是方法。

為了使其運作，我們以一種新的方式看待介面。

直到最近，Go 規格說介面定義了一組方法，這大致是介面中列舉的方法集。實作所有這些方法的任何型別都實作了該介面。

但是，從這個角度來看，介面定義了一組型別，即實作這些方法的型別。從這個角度來看，介面型別的值是介面型別集合的元素，而不是介面型別的實作。

這兩種觀點導致相同的結果：對於每組方法，我們都可以想像實作這些方法的型別的相應集合，並且這是介面定義的型別集。

但是，對於我們的目的來說，型別集的觀點比方法集的觀點更具優勢：我們可以明確地將型別添加到集合中，從而以新的方式控制型別集。

我們已經擴展了介面型別的語法，以使其運作。例如，interface{ int|string|bool } 定義了包含型別 int、string 和 bool 的型別集。

另一種說法是，此介面僅由 int、string 或 bool 滿足。

現在讓我們看一下 constraints.Ordered 的實際定義：

```go
type Ordered interface {
    Integer|Float|~string
}
```

此宣告表示 Ordered 介面是所有整數、浮點和字串型別的集合。垂直線表示型別的聯集（在這種情況下是型別集的聯集）。Integer 和 Float 是在 constraints 套件中以類似方式定義的介面型別。請注意，Ordered 介面沒有定義任何方法。

對於型別約束，我們通常不關心特定型別，例如 string；我們感興趣的是所有 string 型別。這就是 ~ 標記的用途。表達式 ~string 表示底層型別為 string 的所有型別的集合。這包括型別 string 本身以及使用定義 type MyString string 等定義宣告的所有型別。

當然，我們仍然希望在介面中指定方法，並且希望向後兼容。在 Go 1.18 中，介面可以像以前一樣包含方法和嵌入式介面，但是它也可以嵌入非介面型別、聯集和底層型別的集合。

當用作型別約束時，介面定義的型別集確切指定了允許作為相應型別參數的型別引數的型別。在泛型函數主體中，如果運算元（operand）的型別是帶有約束 C 的型別參數 P，則只有在 C 的型別集中的所有型別都允許操作時，才允許操作（目前在這裡有一些實作限制，但是普通程式碼不太可能遇到它們）。

用作約束的介面可以給定名稱（例如 Ordered），也可以是內嵌（inlined）在型別參數串列中的文字介面。例如：

```go
[S interface{~[]E}, E interface{}]
```

這裡 S 必須是切片型別，其元素型別可以是任何型別。

因為這是一個常見的情況，所以可以省略約束位置中的封閉介面 interface{}，我們可以簡單地寫成：

```go
[S ~[]E, E interface{}]
```

因為空介面在型別參數串列中很常見，而且在普通的 Go 程式碼中也很常見，所以 Go 1.18 引入了一個新的預先宣告的識別符號 any，作為空介面型別的別名。有了這個，我們就可以得到這個慣用的程式碼：

```go
[S ~[]E, E any]
```

介面作為型別集是一種強大的新機制，是使型別約束在 Go 中運作的關鍵。目前，使用新的語法形式的介面只能用作約束。但是很容易想像出明確的型別約束介面在一般情況下可能有用。

## 型別推論

最後一個新的主要語言功能是型別推論。在某些方面，這是語言中最複雜的更改，但它很重要，因為它使開發者可以使用自然風格來撰寫呼叫泛型函數的程式碼。

### 函數引數型別推論

使用型別參數需要傳遞型別引數，這可能會導致冗長的程式碼。回到我們的泛型 GMin 函數：

```go
func GMin[T constraints.Ordered](x, y T) T { ... }
```

型別參數 T 用於指定普通非型別引數 x 和 y 的型別。如前所述，可以使用顯式型別引數來呼叫它

```go
var a, b, m float64

m = GMin[float64](a, b) // explicit type argument
```

在許多情況下，編譯器可以從普通引數推斷出 T 的型別引數。這使得程式碼更短，同時保持清晰。

```go
var a, b, m float64

m = GMin(a, b) // no type argument
```

這是透過將引數 a 和 b 的型別與參數 x 和 y 的型別進行匹配來完成的。

這種從函數引數的型別推論型別引數的推論稱為函數引數型別推論。

函數引數型別推論僅適用於函數參數中使用的型別參數，而不適用於僅在函數結果中使用或僅在函數主體中使用的型別參數。例如，它不適用於僅使用 T 作為結果的函數 MakeT\[T any]() T。

### 約束型別推論

語言支援另一種型別推論，約束型別推論。為了描述這一點，讓我們從這個例子開始，這個例子是對整數切片進行縮放：

```go
// Scale returns a copy of s with each element multiplied by c.
// This implementation has a problem, as we will see.
func Scale[E constraints.Integer](s []E, c E) []E {
    r := make([]E, len(s))
    for i, v := range s {
        r[i] = v * c
    }
    return r
}
```

這是一個泛型函數，它可以處理任何整數型別的切片。

現在假設我們有一個多維點型別，其中每個點只是一個整數串列，給出了點的坐標。自然地，這型別會有一些方法。

```go
type Point []int32

func (p Point) String() string {
    // Details not important.
}
```

有時我們想要縮放一個點。因為一個點只是一個整數切片，所以我們可以使用我們之前寫的 Scale 函數：

```go
// ScaleAndPoint doubles a Point and prints it.
func ScaleAndPrint(p Point) {
    r = Scale(p, 2)
    fmt.Println(r.String()) // DOES NOT COMPILE
}
```

不幸的是，無法編譯，並出現錯誤，例如 r.String undefined (type []int32 has no field or method String)。

問題在於 Scale 函數回傳一個型別為 []E 的值，其中 E 是引數切片的元素型別。當我們使用型別為 Point 的值呼叫 Scale 時，其底層型別為 []int32，我們得到的是型別為 []int32 的值，而不是 Point。這是根據泛型程式碼的撰寫方式，但這不是我們想要的。

為了修正這個問題，我們必須更改 Scale 函數，以使用切片型別的型別參數。

```go
// Scale returns a copy of s 
func Scale[S ~[]E, E contrains.Integer](s S, c E) S {
    r := make(S, len(s))
    for i, v := range s {
        r[i] = v * c
    }
    return r
}
```

我們採用了一個新的型別參數 S，它是切片引數的型別。我們對它進行了約束，使其底層型別為 S 而不是 []E，結果型別現在為 S。由於 E 被約束為整數，效果與之前相同：第一個引數必須是某種整數型別的切片。函數主體的唯一變化是，現在在呼叫 make 時，我們傳遞的是 S，而不是 []E。

如果我們使用普通切片呼叫它，新函數的行為與之前相同，但是如果我們使用型別 Point 呼叫它，我們現在會得到一個型別為 Point 的值。這就是我們想要的。使用這個版本的 Scale，之前的 ScaleAndPrint 函數將編譯並執行，就是我們所期望的。

但是，可以問一下：為什麼可以寫呼叫 Scale 而不傳遞明確的型別引數？也就是說，為什麼可以寫 Scale(p, 2)，而不是必須寫 Scale[Point, int32](p, 2)？我們的新 Scale 函數有兩個型別參數，S 和 E。在呼叫 Scale 時不傳遞任何型別引數，函數引數型別推論，如上所述，讓編譯器推斷出 S 的型別引數是 Point。但是函數還有一個型別參數 E，它是乘法因子 c 的型別。相應的函數引數是 2，因為 2 是一個無型別常量，所以函數引數型別推論無法推斷出 E 的正確型別（最多可能推斷出 2 的預設型別，即 int，這是不正確的）。相反，編譯器推斷出 E 的型別引數是切片的元素型別的過程稱為約束型別推論。

約束型別推論從型別參數約束中推斷出型別引數。當一個型別參數有一個以另一個型別參數為條件的約束時，它就會被使用。當其中一個型別參數的型別引數已知時，約束就會被用來推斷出另一個型別參數的型別引數。

約束型別推論的一般情況是，一個約束使用 ~type 的形式，其中 type 是使用其他型別參數寫的型別。我們在 Scale 範例中看到了這一點。S 是 ~[]E，~ 後面跟著一個型別 []E，用另一個型別參數寫成。如果我們知道 S 的型別引數，我們就可以推斷出 E 的型別引數。S 是一個切片型別，而 E 是該切片的元素型別。

這只是約束型別推論的介紹。詳細資料請參閱[提案文件](https://go.googlesource.com/proposal/+/HEAD/design/43651-type-parameters.md)或[語言規範](https://go.dev/ref/spec)。

## 參考來源

- [An Introduction To Generics](https://go.dev/blog/intro-generics)