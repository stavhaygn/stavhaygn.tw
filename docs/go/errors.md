---
sidebar_position: 1
---

# Error

非原創內容

在 Go 語言中，錯誤是一個普通的值，並且通常是函數的最後一個回傳值，其為 error 型別。如果函數執行成功，則 error 型別為 nil，否則為錯誤訊息。此設計讓開發者能夠更細緻地控制並處理可能出現的錯誤情況。例如 os.Open() 函數，其回傳值為 *os.File 和 error。

```go
func Open(name string) (file *File, err error)
```

```go
f, err := os.Open("filename.ext")
if err != nil {
    // 處理錯誤
    log.Fatal(err)
}
```

## error 型別

error 型別是一個 interface，只有一個方法 Error() string，其回傳一個錯誤訊息。

```go
type error interface {
    Error() string
}
```

平常使用到的是 errors 套件中未匯出的 errorString 型別，其為一個 struct，只有一個 Error() string 方法回傳一個錯誤訊息。

```go
type errorString struct {
    s string
}

func (e *errorString) Error() string {
    return e.s
}
```

使用 errors.New() 函數建立自定義的 error 型別。errors.New() 函數接收一個字串，建立一個 errorString 型別，並作為 error 型別回傳。

```go
func New(text string) error {
    return &errorString{text}
}
```

例如定義一個 Sqrt() 函數，其回傳值為 float64 和 error，如果輸入值為負數，則回傳 0 和 error。

```go
func Sqrt(f float64) (float64, error) {
    if f < 0 {
        return 0, errors.New("math: square root of negative number")
    }
    // 處理正常情況
    // ...
}
```

* https://go.dev/blog/error-handling-and-go
* https://go.dev/blog/errors-are-values
* https://go.dev/blog/go1.13-errors

