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


有時候我們會將錯誤與已知的_特定（sentinel）_值比較，以檢查是否發生了特定的錯誤。


```go
var ErrNotFound = errors.New("not found")

if err == ErrNotFound {
    // something wasn't found
}
```

錯誤值可以是任何滿足語言定義的 error 介面的型別。程式可以使用型別斷言或型別判斷來將錯誤值視為更特定的型別。

```go
type NotFoundError struct {
    Name string
}

func (e *NotFoundError) Error() string {
    return e.Name + ": not found"
}

if e, ok := err.(*NotFoundError); ok {
    // e.Name wasn't found
}
```

### 添加訊息

通常一個函數會在將錯誤傳遞到呼叫堆疊的上層時，會添加一些資訊，像是一個簡短的描述，說明錯誤發生時正在發生什麼事情。一個簡單的方式是建構一個新的錯誤，並將先前錯誤的訊息包含在其中：

```go
if err != nil {
    return fmt.Errorf("decompress %v: %v", name, err)
}
```

使用 fmt.Errorf 建構一個新的錯誤，會捨棄原始錯誤中除了文字之外的所有內容。如同我們在 QueryError 中看到的，有時候我們會想要定義一個新的錯誤型別，包含底層的錯誤，以便程式碼檢查。這裡再次看到 QueryError：

```go
type QueryError struct {
    Query string
    Err   error
}
```

程式可以查看 *QueryError 值，並根據底層的錯誤做出決定。有時候你會看到這被稱為「解包裝」錯誤。

```go
if e, ok := err.(*QueryError); ok && e.Err == ErrPermission {
    // query failed because of a permission problem
}
```

標準函數庫中的 os.PathError 型別是另一個包含另一個錯誤的例子。

## 在 Go 1.13 中

### Unwrap 方法

Go 1.13 在 errors 與 fmt 標準函數庫中引入了新的功能，以簡化處理包含其他錯誤的錯誤。其中最重要的是一個慣例而不是一個變更：包含另一個錯誤的錯誤可能會實作 Unwrap 方法，以回傳底層的錯誤。如果 e1.Unwrap() 回傳 e2，我們就說 e1 包裝了 e2，並且你可以解包裝 e1 以取得 e2。

根據這個慣例，我們可以給上面的 QueryError 型別一個回傳包含錯誤的 Unwrap 方法：

```go
func (e *QueryError) Unwrap() error { return e.Err }
```

解包裝錯誤的結果可能會有一個 Unwrap 方法；我們稱重複解包裝所產生的錯誤序列為_錯誤鏈（error chain）_。

### 使用 Is 與 As 檢查錯誤

Go 1.13 的 errors 套件包含兩個新的函數用於檢查錯誤：Is 與 As。

errors.Is 函數會將錯誤與值比較。

```go
// Similar to:
//   if err == ErrNotFound { ... }
if errors.Is(err, ErrNotFound) {
    // something wasn't found
}
```

The As function tests whether an error is a specific type.

errors.As 函數會測試錯誤是否為特定型別。

```go
// Similar to:
//   if e, ok := err.(*QueryError); ok { ... }
var e *QueryError
// Note *QueryError is the type of error.
if errors.As(err, &e) {
    // err is a *QueryError, and e is set to the error's value
}
```

在最簡單的情況下，errors.Is 函數會像是與特定錯誤比較，而 errors.As 函數會像是型別斷言。然而，當操作包裝錯誤時，這些函數會考慮錯誤鏈中的所有錯誤。讓我們再次看一下上面解包裝 QueryError 以檢查底層錯誤的例子：

```go
if e, ok := err.(*QueryError); ok && e.Err == ErrPermission {
    // query failed because of a permission problem
}
```

我們可以使用 errors.Is 來簡化這個檢查：

```go
if errors.Is(err, ErrPermission) {
    // err, or some error that it wraps, is a permission problem
}
```

errors 套件也包含一個新的 Unwrap 函數，它會回傳呼叫錯誤的 Unwrap 方法的結果，或是當錯誤沒有 Unwrap 方法時回傳 nil。然而，通常使用 errors.Is 或 errors.As 會比較好，因為這些函數會在單一呼叫中檢查整個錯誤鏈。

注意：雖然將指標傳給指標可能會感覺很奇怪，但在這個情況下是正確的。請將它視為將指標傳給錯誤型別的值；在這個情況下，回傳的錯誤是指標型別。

### 使用 %w 包裝錯誤

### 是否要包裝

## 使用 Is 與 As 方法客製化錯誤測試

## 錯誤與套件 API

## 結論

## 參考來源

- [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
