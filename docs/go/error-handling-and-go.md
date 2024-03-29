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
// do something with the open *File f
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

最常使用到的是 errors 套件中未匯出的 errorString 結構型別，它只有一個 Error() string 方法回傳一個錯誤訊息。

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
    // implementation
}
```
呼叫者傳遞一個負數給 Sqrt() 函數，它會回傳一個 non-nil 錯誤值。呼叫者可以透過呼叫 error 的 Error() 方法取得錯誤訊息，或者直接印出它

```
f, err := Sqrt(-1)
if err != nil {
    fmt.Println(err)
}
```
fmt 套件會呼叫錯物值的 Error() 方法，並格式化回傳的字串。

錯誤實作的職責是總結上下文。os.Open 各式化回傳的錯誤訊息為 "open /etc/passwd: permission denied"，而不是僅為 "permission denied"。這樣的設計可以讓呼叫者更容易理解錯誤的原因。顯然我們剛才所宣告的 Sqrt() 函數所回傳的錯誤訊息，並沒有關於無效引數值的資訊

為了增加資訊，可以透過 fmt 套件中的 Errorf 函數。它會根據 Printf 的規則格式化字串，並回傳由 errors.New 建立的錯誤值。

```go
if f < 0 {
    return 0, fmt.Errorf("math: square root of negative number %g", f)
}
```

在很多的情況下，使用 fmt.Errorf 已足夠。而由於 error 是一種介面，可以使用任意的資料結構作為錯誤值，藉此讓呼叫者可以檢查錯誤的詳細資訊。

例如，呼叫者可能想要復原傳遞給 Sqrt 的無效引數。我們可以藉由定義一個新的實作 error 的型別來替代 errors.errorString。

```go
type NegativeSqrtError float64

func (f NegativeSqrtError) Error() string {
    return fmt.Sprintf("math: square root of negative number %g", float64(f))
}
```

```go
func Sqrt(f float64) (float64, error) {
    if f < 0 {
        return 0, NegativeSqrtError(f)
    }
    // implementation
}
```

呼叫者可以透過型別斷言確認是否為 NegativeSqrtError 型別的值，並特別處理。而對於僅將錯誤值傳遞給 fmt.Println 或 log.Println 的呼叫者，不會看到行為上的改變。

```go
if _, err := Sqrt(-1.1); err != nil {
    if f, ok := err.(NegativeSqrtError); ok {
        fmt.Println("negative number:", float64(f))
    }
}
```

另一個例子，json 套件指定 json.Decode 函數在解析 JSON blob 時遇到語法錯誤時回傳的 SyntaxError 型別。

```go
type SyntaxError struct {
    msg    string // description of error
    Offset int64  // error occurred after reading Offset bytes
}

func (e *SyntaxError) Error() string { return e.msg }
```

Offset 屬性不會在使用 error 的預設格式時顯示，但是呼叫者可以使用它來找出錯誤發生的位置。

```go
if err := dec.Decode(&val); err != nil {
    if serr, ok := err.(*json.SyntaxError); ok {
        line, col := findLine(f, serr.Offset)
        return fmt.Errorf("%s:%d:%d: %v", f.Name(), line, col, err)
    }
    return err
}
```

error 介面只需要 Error 方法；而特定的 error 實作可以提供其他方法。例如 net 套件根據慣例回傳的 error 型別的錯誤，但某些 error 實作擁有 net.Error 介面定義的額外方法。

```go
package net

type Error interface {
    error
    Timeout() bool   // Is the error a timeout?
    Temporary() bool // Is the error temporary?
}
```

因此客戶端程式碼可以使用型別斷言來測試 net.Error，並區分為暫時性網路錯誤與永久性網路錯誤。例如網路爬蟲可以在遇到暫時性錯誤時，等待一段時間後重試，否則就放棄。

```go
if nerr, ok := err.(net.Error); ok && nerr.Temporary() {
    time.Sleep(1e9)
    continue
}
if err != nil {
    log.Fatal(err)
}
```

## 簡化重複的錯誤處理

在 Go 語言中，錯誤處理很重要。該語言的設計與慣例鼓勵開發者在每個錯誤處理路徑上都有明確的處理方式（與其它語言拋出例外並且有時捕捉例外的慣例不同）。在某些情況下會導致 Go 程式碼過於冗長，但幸運的可以使用一些技術來最大化減少重複的錯誤處理。

考慮 App Engine 應用程式，該應用程式具有一個 HTTP 處理器，能構從資料儲存區檢索紀錄並使用模版對其格式化。

```go
func init() {
    http.HandleFunc("/view", viewRecord)
}

func viewRecord(w http.ResponseWriter, r *http.Request) {
    c := appengine.NewContext(r)
    key := datastore.NewKey(c, "Record", r.FormValue("id"), 0, nil)
    record := new(Record)
    if err := datastore.Get(c, key, record); err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    if err := viewTemplate.Execute(w, record); err != nil {
        http.Error(w, err.Error(), 500)
    }
}
```

viewRecord 函數處理 datastore.Get 函數和 viewTemplate.Execute 函數回傳的錯誤。再這兩種情況下，它都會像使用者顯示一條簡單的錯誤訊息，其中包含 HTTP 狀態碼為 500。這看起來是一個可管理的程式碼行數，但後續增加更多的 HTTP 處理器，也會產生許多相同的錯誤處理的程式碼。

為了減少重複的程式碼，我們可以定義一個自己的 HTTP appHandler 型別，它包含 error 型別的回傳值。

```go
type appHandler func(http.ResponseWriter, *http.Request) error
```

接著修改 viewRecord 函數，讓它回傳錯誤值。

```go
func viewRecord(w http.ResponseWriter, r *http.Request) error {
    c := appengine.NewContext(r)
    key := datastore.NewKey(c, "Record", r.FormValue("id"), 0, nil)
    record := new(Record)
    if err := datastore.Get(c, key, record); err != nil {
        return err
    }
    return viewTemplate.Execute(w, record)
}
```

這比原本的更為簡單，但是 http 套件不接受函數所回傳的錯誤值。為了解決這問題，我們在 appHandler 上實作 http.Handler 介面的 ServeHTTP 方法。

```go
func (fn appHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    if err := fn(w, r); err != nil {
        http.Error(w, err.Error(), 500)
    }
}
```

ServeHTTP 方法會呼叫 appHandler 函數，並將錯誤值轉換為 HTTP 錯誤回應給使用者。注意該方法的接收者 fn 是一個函數。（沒錯！Go 可以做到這件事！）ServeHTTP 方法透過在表達式 fn(w, r) 中呼叫接收者來調用函數。

現在，使用 http 套件註冊 viewRecord 時，使用 Handle 方法（取代 HandleFunc），因為 appHandler 是一個 http.Handler（不是 http.HandlerFunc）。

```go
func init() {
    http.Handle("/view", appHandler(viewRecord))
}
```

有了基本的錯誤處理方式，可以使它對於使用者更為友善。相較於直接顯示錯誤訊息，更好的作法是給予使用者適合的 HTTP 狀態碼及簡單的錯誤訊息，並且在 App Engine 開發者控制台紀錄完整的錯誤訊息，以便於除錯。

為了做到這點，我們建立一個包含 error 與其它屬性的 appError 結構。

```go
type appError struct {
    Error   error
    Message string
    Code    int
}
```

現在我們修改 appHandler 行別，讓它回傳 *appError 型別的值。

```go
type appHandler func(http.ResponseWriter, *http.Request) *appError
```

（通常回傳實作 error 介面的具體型別而不是 errror 是一個錯誤的作法，請參考 [Go FAQ](https://go.dev/doc/faq#nil_error) 中討論的原因，但在此範例中是正確的，因為僅有 ServeHTTP 看到該值與使用其內容的地方）

使 appHandler 的 ServeHTTP 方法向使用者顯示正確的狀態碼及 appError 的 Message ，並將完整的錯誤訊息紀錄在 App Engine 開發者控制台。

```go
func (fn appHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    if e := fn(w, r); e != nil { // e is *appError, not os.Error.
        c := appengine.NewContext(r)
        c.Errorf("%v", e.Error)
        http.Error(w, e.Message, e.Code)
    }
}
```

最後，我們更新了 viewRecord 的函數特徵，使它在遇到錯誤時可以回傳更多的上下文。

```go
func viewRecord(w http.ResponseWriter, r *http.Request) *appError {
    c := appengine.NewContext(r)
    key := datastore.NewKey(c, "Record", r.FormValue("id"), 0, nil)
    record := new(Record)
    if err := datastore.Get(c, key, record); err != nil {
        return &appError{err, "Record not found", 404}
    }
    if err := viewTemplate.Execute(w, record); err != nil {
        return &appError{err, "Can't display record", 500}
    }
    return nil
}
```

這個版本的 viewRecord 與原本的版本所使用的程式碼行數相同，但是現在的每一行程式碼都有特定的意義，並且使我們提供更友善的使用者體驗。

但事情還沒有結束；我們可以進一步改善錯誤處理，以下是一些想法：
- 建立一個專門處理錯誤的處理器，使它渲染錯誤頁面的模板。
- 當使用者是管理者時，發生錯誤時顯示堆疊追蹤，更便於除錯。
- 增加 appError 的建構函數，透過它儲存堆疊追蹤，以便於除錯。
- recover 在 appHandler 中發生的 panic，並在開發者控制台紀錄這些錯誤為「Critical」，同時僅向使用者回應「發生嚴重的錯誤」。這是一個很好的作法，避免讓使用者看到程式碼引發的錯誤，而難以理解。可參考 [Defer, Panic, and Recover](https://go.dev/blog/defer-panic-and-recover) 文章，了解更多關於 panic 的資訊。

## 結論

適當的錯誤處理是好軟體的基本要求。採用本文中說明的技術，你應該可以寫出更可靠與簡潔的 Go 程式碼。

## 內容來源

- [Error handling and Go](https://go.dev/blog/error-handling-and-go)

