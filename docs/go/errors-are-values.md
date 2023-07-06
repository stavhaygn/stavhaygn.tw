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

```go
func (s *Scanner) Scan() (token []byte, error)
```

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

```go
if err != nil
```

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
