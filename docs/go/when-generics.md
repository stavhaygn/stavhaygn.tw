---
sidebar_position: 5
---

# [go.dev] 泛型使用時機

> 非原創內容，來源為 Ian Lance Taylor 於 2022 年 4 月 12 日的文章 [When To Use Generics](https://go.dev/blog/when-generics)，如有版權問題，請告知，將會立即刪除。

## 介紹

原作者 Ian Lance Taylor 在 Google Open Source Live 上的分享。
<iframe width="560" height="315" src="https://www.youtube.com/embed/nr8EpUO9jhw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

Go 1.18 版本新增了一個重大的新語言功能：支援泛型程式設計。在本文中，我不會描述泛型是什麼，也不會描述如何使用它們。本文是關於何時在 Go 程式碼中使用泛型，以及何時不要使用它們。

為了清楚起見，我將提供一般性的指引，而不是硬性規定。請自行判斷。但如果你不確定，我建議使用這裡討論到的指引。

## 內容來源

- [when-generics](https://go.dev/blog/when-generics)
