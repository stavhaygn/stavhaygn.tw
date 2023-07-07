---
sidebar_position: 3
---

# [go.dev] 在 Go 1.13 中處理錯誤


> 非原創內容，來源為 Damien Neil 與 Jonathan Amsterdam 於 2019 年 10 月 17 日的文章 [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)，如有版權問題，請告知，將會立即刪除。

## 介紹

Go 將錯誤視為值 [errors as values](https://go.dev/blog/errors-are-values) 的方式在過去十年間為我們提供了很好的幫助。儘管標準函數庫對於錯誤的支援很少——僅有 errors.New 與 fmt.Errorf 函數，他們只包含了一條錯誤訊息——內建的 error 介面允許 Go 開發者添加他們想要的任何資訊。型別要滿足 error 介面所需要實作只有 Error 方法：

```go
type QueryError struct {
    Query string
    Err   error
}

func (e *QueryError) Error() string {
    return e.Query + ": " + e.Err.Error()
}
```

像是這樣的錯誤型別無所不在，它們儲存的訊息範圍廣泛，從時間戳記、檔案名稱到伺服器位址。通常該訊息會包含另一個低階的錯誤以提供額外的上下文資訊。

一個錯誤包含另一個錯誤的模式在 Go 語言中非常普遍，以至於在廣泛的討論之後，Go 1.13 為其增加了明確的支援。這篇文章會說明標準函數庫為提供支援所新增的功能：三個在 errors 套件中的函數，以及 fmt.Errorf 新的格式化動詞 %w。

再詳細說明變更之前，讓我們回顧一下在語言之前的版本中，是如何檢查與建構錯誤的。

## 在 Go 1.13 以前

### 檢查錯誤

在 Go 中，錯誤是值。程式會根據這些值做出決定，最常見的方式是將錯誤與 nil 比較，以檢查操作是否失敗。

```go
if err != nil {
    // something went wrong
}
```


有時候我們會將錯誤與已知的_特定_值比較，以檢查是否發生了特定的錯誤。


```go
var ErrNotFound = errors.New("not found")

if err == ErrNotFound {
    // something wasn't found
}
```

錯誤值可以是任何滿足語言定義的 error 介面的型別。程式可以使用型別斷言或型別判斷來將錯誤值視為更特定的型別。

```go
```

### 添加訊息

## 在 Go 1.13 中

### Unwrap 方法

### 使用 Is 與 As 檢查錯誤

### 使用 %w 包裝錯誤

### 是否要包裝

## 使用 Is 與 As 方法客製化錯誤測試

## 錯誤與套件 API

## 結論

## 參考來源

- [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
