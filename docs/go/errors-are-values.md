---
sidebar_position: 2
---

# [go.dev] 錯誤是值

> 非原創內容，來源為 Rob Pike 於 2015 年 1 月 12 日的文章 [Errors are values](https://go.dev/blog/errors-are-values)，如有版權問題，請告知，將會立即刪除。

在 Go 開發者中最常討論到的一點就是如何做錯誤處理，尤其是從其他語言轉換過來的開發者。他們的對話中都提到了對重複出現的錯誤處理感到不滿。

```go
if err != nil {
    return err
}
```

如上方程式碼片斷所示。對全部能夠找到的開源專案進行分析，發現了這程式碼片斷在一頁程式碼中只會出現一到兩次，少於你想像的次數。儘管如此，這些開發者仍然對於一直輸入

```go
if err != nil
```

感到不滿，肯定有什麼地方出錯了，甚至很明顯就是 Go 語言本身。

剛接觸 Go 語言的開發者可能會問：「如何處理錯誤」，接著學習到了該模式（if err != nil），於是就此停止了。在其他語言中，可能是使用 try-catch 區塊或其他類似的機制處理錯誤。因此，這些開發者認為只要在 Go 語言中，將過去語言中使用的 try-catch，改為 err != nil 就可以了。隨著時間的過去，Go 語言收集到了許多這樣的程式碼片斷，結果使人感覺很笨拙。

無論這種解釋是否合適，很顯然的是這些 Go 開發者忽略的關於錯誤的一個基本觀點：「錯誤是值」

值是可以被程式設計的，而因為錯誤是值，所以錯誤也是可以被程式設計的。

當然，關於錯誤值的常見語句是檢查它是否為 nil，但是我們仍然可以利用錯誤值做到很多事情，並應用其中的一些技術使我們的程式更好，同時消除了那些如果遇到錯誤，就機械式的 if 語句檢查每個錯誤的模版程式碼。

這裡有個來自於 bufio 套件中的 Scanner 型別的簡單的範例。它的 Scan 方法會執行底層的 I/O，當然的也可能會發生錯誤。然而 Scan 方法根本沒有匯出錯誤。取而代之，它會回傳一個布林值與一個單獨的方法，並在掃描結束時執行它，它會回報是否有錯誤發生。客戶端程式碼可能像這樣：

```go
scanner := bufio.NewScanner(input)
for scanner.Scan() {
    token := scanner.Text()
    // process token
}
if err := scanner.Err(); err != nil {
    // process the error
}
```

當然的，有對錯誤值是否為 nil 的檢查，但是它只出現一次。Scan 方法本來可以被定義為

```go
func (s *Scanner) Scan() (token []byte, error)
```

然後使用者程式碼可以會是（取決於 token 的檢索方式）

```go
scanner := bufio.NewScanner(input)
for {
    token, err := scanner.Scan()
    if err != nil {
        return err // or maybe break
    }
    // process token
}
```

雖然沒有很大的不同，但是有一個重要的區別。在這段程式碼中，使用者必須每次的迭代中去檢查錯誤，但在真正的 Scanner API 中，錯誤處理從關鍵的 API 中被抽象出來。使用真正的 API 時，使用者程式碼因此可以顯得更自然，直到迴圈結束時，才去關心錯誤。因此錯誤處理並沒有使控制流程變得模糊。

與此同時，一旦當 Scan 發生 I/O 的錯誤時，它會紀錄下來，並且回傳 false。另一個單獨的方法 Err，會在使用者詢問時回報錯誤值。雖然概念很簡單，但它不同於到處都是的

```go
if err != nil
```

或要求使用者在每一個 token 後檢查錯誤。這是對錯誤值的程式設計，雖然很簡單，但仍然是程式設計。

值得強調的是，無論如何設計，程式檢查錯誤是至關重要的，無論那些錯誤是否被匯出。這裡討論的不是如何避免檢查錯誤，而是如何使用程式語言優雅的處理錯誤。

一位熱情的 gopher，@jxck_，他在 GoCon 2014 的重複的錯誤檢查程式碼主題中，分享了像以下的程式碼：

```go
_, err = fd.Write(p0[a:b])
if err != nil {
    return err
}
_, err = fd.Write(p1[c:d])
if err != nil {
    return err
}
_, err = fd.Write(p2[e:f])
if err != nil {
    return err
}
// and so on
```

這重複了非常多次錯誤檢查，在實際的程式碼中，它更為冗長。因此不容易使用輔助函數進行重構，但以這種理想化的型式下，詞法繫結了錯誤變數的函數會有所幫助：

```go
var err error
write := func(buf []byte) {
    if err != nil {
        return
    }
    _, err = w.Write(buf)
}
write(p0[a:b])
write(p1[c:d])
write(p2[e:f])
// and so on
if err != nil {
    return err
}
```

這個模式執行的很順利，但每個進行寫入的函數都必須有一個閉包；因為必須在呼叫之間維護 err 變數，所以單獨的輔助函數使用起來會比較笨拙。

```go
type errWriter struct {
    w   io.Writer
    err error
}
```

```go
func (ew *errWriter) write(buf []byte) {
    if ew.err != nil {
        return
    }
    _, ew.err = ew.w.Write(buf)
}
```

```go
ew := &errWriter{w: fd}
ew.write(p0[a:b])
ew.write(p1[c:d])
ew.write(p2[e:f])
// and so on
if ew.err != nil {
    return ew.err
}
```

```go
b := bufio.NewWriter(fd)
b.Write(p0[a:b])
b.Write(p1[c:d])
b.Write(p2[e:f])
// and so on
if b.Flush() != nil {
    return b.Flush()
}
```

## 參考來源

- [Errors are values](https://go.dev/blog/errors-are-values)
