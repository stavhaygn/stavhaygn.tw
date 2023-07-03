---
sidebar_position: 1
---

# [go.dev] 錯誤處理

> 非原創內容，來源為 Andrew Gerrand 於 2011 年 7 月 12 日的文章 [Error handling and Go](https://go.dev/blog/error-handling-and-go)，如有版權問題，請告知，將會立即刪除。

## 介紹

在 Go 語言中，錯誤是一個普通的值，為內建的 error 型別。錯誤值被用於表明不正常的狀態，通常是函數的最後一個回傳值。例如當檔案開啟失敗時，os.Open() 函數會回傳一個 non-nil 的錯誤值。

```go
func Open(name string) (file *File, err error)
```

以下程式碼使用 os.Open() 開啟一個檔案。如果發生錯誤，則使用 log.Fatal() 函數顯示錯誤訊息並結束程式。

```go
f, err := os.Open("filename.ext")
if err != nil {
    log.Fatal(err)
}
// 對開啟的檔案進行處理
```

以下內容探討 Go 語言中錯誤處理的良好實務。

## error 型別

error 型別是一個 interface，只有一個方法 Error() string，其回傳一個錯誤訊息。

```go
type error interface {
    Error() string
}
```

與全部內建的型別一樣，error 型別是在 [universe block](https://go.dev/ref/spec#Blocks) 中預先宣告的。

最常使用到的是 errors 套件中未匯出的 errorString 型別，其為一個 struct，只有一個 Error() string 方法回傳一個錯誤訊息。

```go
type errorString struct {
    s string
}

func (e *errorString) Error() string {
    return e.s
}
```

可以使用 errors.New() 建構一個錯誤值。它接收一個字串並轉換為 errors.errorString 型別的值，接著作為 error 型別回傳。

```go
func New(text string) error {
    return &errorString{text}
}
```

例如以下方式使用 errors.New

```go
func Sqrt(f float64) (float64, error) {
    if f < 0 {
        return 0, errors.New("math: square root of negative number")
    }
    // 處理正常情況
    // ...
}
```

## 參考來源
* https://go.dev/blog/error-handling-and-go

