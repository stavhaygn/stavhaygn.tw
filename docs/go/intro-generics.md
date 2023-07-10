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
- 型別推斷，允許在許多情況下在呼叫函數時省略型別參數。

## 型別參數

函數和型別現在允許有型別參數。型別參數列表看起來像一般的參數列表，只是它使用方括號而不是圓括號。

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

我們可以通過添加型別參數列表來使此函數成為泛型，使其適用於不同的型別。在此範例中，我們添加了一個帶有單個型別參數 T 的型別參數列表，並將 float64 的使用替換為 T。

```go
import "golang.org/x/exp/constraints"

func GMin[T constraints.Ordered](x, y T) T {
    if x < y {
        return x
    }
    return y
}
```

## 參考來源

- [An Introduction To Generics](https://go.dev/blog/intro-generics)
