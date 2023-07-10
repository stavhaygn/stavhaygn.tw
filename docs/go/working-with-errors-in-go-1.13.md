---
sidebar_position: 3
---

# [go.dev] 在 Go 1.13 中處理錯誤

> 非原創內容，來源為 Damien Neil 與 Jonathan Amsterdam 於 2019 年 10 月 17 日的文章 [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)，如有版權問題，請告知，將會立即刪除。

## 介紹

Go 將錯誤視為值 [errors as values](https://go.dev/blog/errors-are-values) 的方式在過去十年間為我們提供了很好的幫助。儘管標準函數庫對於錯誤的支援很少——僅有 errors.New 與 fmt.Errorf 函數，他們只包含了一條錯誤訊息——內建的 error 介面允許 Go 開發者添加他們想要的任何資訊。型別要滿足 error 介面所需要實作的只有 Error 方法：

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

errors 套件中的 Unwrap 函數實作可參考 [/src/errors/wrap.go](https://github.com/golang/go/blob/master/src/errors/wrap.go)。

```go title="/src/errors/wrap.go"
func Unwrap(err error) error {
	// highlight-start
	u, ok := err.(interface {
		Unwrap() error
	})
	// highlight-end
	if !ok {
		return nil
	}
	return u.Unwrap()
}
```

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

如前所述，使用 fmt.Errorf 函數將額外的資訊加入錯誤是很常見的。

```go
if err != nil {
    return fmt.Errorf("decompress %v: %v", name, err)
}
```

在 Go 1.13 中，fmt.Errorf 函數支援一個新的 %w 動詞。當這個動詞存在時，fmt.Errorf 回傳的錯誤會有 Unwrap 方法，該方法會回傳 %w 的參數，該參數必須是一個錯誤。在其他方面，%w 與 %v 相同。

```go
if err != nil {
    // Return an error which unwraps to err
    return fmt.Errorf("decompress %v: %w", name, err)
}
```

使用 %w 包裝錯誤會讓它可以被 errors.Is 與 errors.As 使用：

```go
err := fmt.Errorf("access denied: %w", ErrPermission)
...
if errors.Is(err, ErrPermission) ...
```

可以看到在 fmt 套件中定義了 wrapError 結構，當 %w 存在於 format 時，fmt.Errorf 會回傳 wrapError 結構，並將原始錯誤儲存在 err 屬性中。可參考 [/src/fmt/errors.go](https://github.com/golang/go/blob/master/src/fmt/errors.go)。

```go title="/src/fmt/errors.go"
func Errorf(format string, a ...any) error {
	p := newPrinter()
	p.wrapErrs = true
	p.doPrintf(format, a)
	s := string(p.buf)
	var err error
	switch len(p.wrappedErrs) {
	case 0:
		err = errors.New(s)
	case 1:
		w := &wrapError{msg: s}
		w.err, _ = a[p.wrappedErrs[0]].(error)
		err = w
	default:
		if p.reordered {
			sort.Ints(p.wrappedErrs)
		}
		var errs []error
		for i, argNum := range p.wrappedErrs {
			if i > 0 && p.wrappedErrs[i-1] == argNum {
				continue
			}
			if e, ok := a[argNum].(error); ok {
				errs = append(errs, e)
			}
		}
		err = &wrapErrors{s, errs}
	}
	p.free()
	return err
}

type wrapError struct {
	msg string
	err error
}

func (e *wrapError) Error() string {
	return e.msg
}

func (e *wrapError) Unwrap() error {
	return e.err
}
```

### 是否要包裝

在錯誤中加入額外的內容時，無論是使用 fmt.Errorf 或是自訂型別，你都需要決定新的錯誤是否要包裝原始錯誤。這個問題沒有單一的答案；它取決於建立新錯誤的內容。包裝錯誤以讓呼叫者可以使用。若會暴露實作細節時，則不要包裝錯誤。

像是一個 Parse 函數，它從 io.Reader 讀取複雜的資料結構。如果發生錯誤，我們希望報告發生錯誤的行列數。如果錯誤發生在從 io.Reader 讀取時，我們會想要包裝錯誤以允許檢查底層的問題。因為呼叫者提供了 io.Reader 給函數，所以公開由它產生的錯誤是有意義的。

相反地，一個會呼叫數次資料庫的函數可能不應該回傳可以 unwrap 到其中一個呼叫的結果的錯誤。如果該函數使用的資料庫是實作細節，那麼公開這些錯誤就是違反抽象的。例如，如果你的套件 pkg 的 LookupUser 函數使用 Go 的 database/sql 套件，那麼它可能會遇到 sql.ErrNoRows 錯誤。如果你回傳 fmt.Errorf("accessing DB: %v", err) 這個錯誤，那麼呼叫者就無法查看裡面的 sql.ErrNoRows。但如果函數改為回傳 fmt.Errorf("accessing DB: %w", err)，那麼呼叫者就可以合理地寫

```go
err := pkg.LookupUser(...)
if errors.Is(err, sql.ErrNoRows) ...
```

在這點上，即使你切換到不同的資料庫套件，為了不破壞你的客戶端，函數則必須總是回傳 sql.ErrNoRows。換句話說，包裝錯誤會讓錯誤成為你的 API 的一部分。如果你不想要承諾在未來支援該錯誤作為你的 API 的一部分，那麼你就不應該包裝錯誤。

重要的是要記住，無論你是否包裝，錯誤訊息都會是一樣的。試著理解錯誤的人會有相同的資訊；包裝的選擇是關於是否給予程式額外的資訊以便它們可以做出更明智的決定，或是保留該資訊以維持抽象層。

## 使用 Is 與 As 方法客製化錯誤測試

errors.Is 函數會檢查鏈中的每個錯誤是否與目標值相符。預設情況下，如果兩者相等，則錯誤與目標相符。此外，鏈中的錯誤可能會實作 Is 方法來宣告它與目標相符。

舉個例子，考慮這個受 Upspin 錯誤套件啟發的錯誤，它會將錯誤與模版進行比較，並只考慮模版中非零的屬性：

```go
type Error struct {
	Path string
	User string
}

func (e *Error) Is(target error) bool {
	t, ok := target.(*Error)
	if !ok {
		return false
	}
	return (e.Path == "" || e.Path == t.Path) &&
		(e.User == "" || e.User == t.User)
}

if errors.Is(err, &Error{User: "someuser"}) {
	// err's User field is "someuser".
}
```

errors.As 函數同樣地，在 As 方法有實作時會呼叫它。

關於 errors.Is 函數的實作，可參考 [/src/errors/wrap.go](https://github.com/golang/go/blob/master/src/errors/wrap.go)。
```go title="/src/errors/wrap.go"
func Is(err, target error) bool {
	if target == nil {
		return err == target
	}

	isComparable := reflectlite.TypeOf(target).Comparable()
	for {
		if isComparable && err == target {
			return true
		}
		// highlight-next-line
		if x, ok := err.(interface{ Is(error) bool }); ok && x.Is(target) {
			return true
		}
		switch x := err.(type) {
		case interface{ Unwrap() error }:
			err = x.Unwrap()
			if err == nil {
				return false
			}
		case interface{ Unwrap() []error }:
			for _, err := range x.Unwrap() {
				if Is(err, target) {
					return true
				}
			}
			return false
		default:
			return false
		}
	}
}
```

## 錯誤與套件 API

套件回傳的錯誤，應該描述開發者有哪些屬性可以依賴。一個設計良好的套件也會避免回傳不應該依賴的錯誤屬性。

最簡單的規格是說，操作要麼成功要麼失敗，分別回傳 nil 或 non-nil 的錯誤值。在許多情況下，不需要更多的資訊。

如果我們希望函數回傳可識別的錯誤狀態，例如「找不到項目」，我們可以回傳一個包裝了特定（sentinel）值的錯誤。

```go
var ErrNotFound = errors.New("not found")

// FetchItem returns the named item.
//
// If no item with the name exists, FetchItem returns an error
// wrapping ErrNotFound.
func FetchItem(name string) (*Item, error) {
	if itemNotFound(name) {
		return nil, fmt.Errorf("%q: %w", name, ErrNotFound)
	}
	// ...
}
```

還有其他現有的模式可以提供錯誤，呼叫者可以進行語意檢查，例如直接回傳特定值、特定型別或是可以透過謂語函數（predicate function）進行檢查的值。

在所有情況下，都應該注意不要向使用者公開內部細節。如[是否要包裝](#是否要包裝)小節所述，在從另一個套件回傳錯誤時，應該將錯誤轉換為不公開底層錯誤的形式，除非你願意承諾在未來回傳該特定錯誤。

```go
f, err := os.Open(filename)
if err != nil {
	// The *os.PathError returned by os.Open is an internal detail
	// To avoid exposing it to the caller, repackage it as a new
	// error with the same text. We use the %v formatting verb, since
	// %w would permit the caller to unwrap the original *os.PathError.
	return fmt.Errorf("%v", err)
}
```

如果函數定義為回傳包裝了特定值或型別的錯誤，不要直接回傳底層錯誤。

```go
var ErrPermission = errors.New("permission denied")

// DoSomething returns an error wrapping ErrPermission if the user
// does not have permission to do something.
func DoSomething() error {
	if !userHasPermission() {
		// If we return ErrPermission directly, callers might come
		// to depend on the exact error value, writing code like this:
		//
		//   if err := pkg.DoSomething(); err == pkg.ErrPermission { ... }
		// 
		// This will cause problems if we want to add additional
		// context to the error in the future. To avoid this, we
		// return an error wrapping the sentinel so that users must
		// always unwrap it:
		//
		//   if err := pkg.DoSomething(); errors.Is(err, pkg.ErrPermission) { ... }
		return fmt.Errorf("%w", ErrPermission)
	}
	// ...
}
```

## 結論

雖然我們討論的變更僅僅是三個函數和一個格式化動詞，但我們希望它們能夠大幅改善 Go 程式中的錯誤處理。我們期望包裝提供額外的內容將變得普遍，幫助程式做出更好的決策，並幫助開發者更快地找到錯誤。

像 Russ Cox 在 2019 年 GopherCon 的主題演講中所說的，我們在前往 Go 2 的路上會進行實驗、簡化和發佈。現在我們已經發佈了這些變更，我們期待接下來的實驗。

## 參考來源

- [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
