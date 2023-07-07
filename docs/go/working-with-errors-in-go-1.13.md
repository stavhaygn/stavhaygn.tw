---
sidebar_position: 3
---

# [go.dev] 在 Go 1.13 中處理錯誤


> 非原創內容，來源為 Damien Neil 與 Jonathan Amsterdam 於 2019 年 10 月 17 日的文章 [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)，如有版權問題，請告知，將會立即刪除。

## 介紹

Go 將錯誤視為值 [errors as values](https://go.dev/blog/errors-are-values) 的方式在過去十年間為我們提供了很好的幫助。儘管標準函數庫對於錯誤的支持很少——僅有 errors.New 與 fmt.Errorf 函數，他們只包含了一條錯誤訊息——內建的 error 介面允許 Go 開發者添加他們想要的任何資訊。型別要滿足 error 介面所需要實作只有 Error 方法：


## 在 Go 1.13 以前

### 檢查錯誤

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
