---
sidebar_position: 5
---

# [go.dev] 泛型使用時機

> 非原創內容，來源為 Ian Lance Taylor 於 2022 年 4 月 12 日的文章 [When To Use Generics](https://go.dev/blog/when-generics)，如有版權問題，請告知，將會立即刪除。

## 介紹

原作者 Ian Lance Taylor 在 Google Open Source Live 上的分享。
<iframe width="560" height="315" src="https://www.youtube.com/embed/nr8EpUO9jhw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

Go 1.18 版本新增了一個重大的新語言功能：支援泛型程式設計。在本文中，我不會描述泛型是什麼，也不會描述如何使用它們。本文是關於何時在 Go 程式碼中使用泛型，以及何時不要使用它們。

為了清楚起見，我將提供通用的指引，而不是硬性規定。請自行判斷。但如果你不確定，我建議使用這裡討論到的指引。

## 撰寫程式碼

讓我們從通用的 Go 程式設計指引開始：透過撰寫程式碼來撰寫 Go 程式，而不是透過定義型別。當談到泛型時，如果你一開始就以定義型別參數的約束來撰寫程式，你可能走錯路了。從撰寫函數開始，當明確知道型別參數會有用時，稍後再加入它是很容易的。

## 什麼時候型別參數會有用？

讓我們看看型別參數有用的情況。

### 當使用語言定義的容器型別時

一種情況是當撰寫函數時，它會操作語言定義的特殊容器型別：切片、映射和通道。如果函數具有這些型別的參數，並且函數程式碼不會對元素型別做出任何特定的假設，那麼使用型別參數可能會很有用。

例如，這是一個函數，它會傳回任何型別的映射中所有鍵的切片：

```go
// MapKeys returns a slice of all the keys in m.
// The keys are not returned in any particular order.
func MapKeys[Key comparable, Val any](m map[Key]Val) []Key {
    s := make([]Key, 0, len(m))
    for k := range m {
        s = append(s, k)
    }
    return s
}
```

這段程式碼不會對映射鍵型別做任何假設，也不會使用映射值型別。它適用於任何映射型別。這使它成為使用型別參數的優秀候選者。

這種函數的替代方法通常是使用反射，但這是一種更笨拙的程式設計模型，並且在建置時不會在靜態類型檢查，而且在執行時通常會更慢。

以下是使用反射的範例：
```go
// MapKeys returns a slice of all the keys in m.
// The keys are not returned in any particular order.
func MapKeys(m interface{}) []interface{} {
    v := reflect.ValueOf(m)
    if v.Kind() != reflect.Map {
        panic("not a map")
    }
    s := make([]interface{}, 0, v.Len())
    for _, k := range v.MapKeys() {
        s = append(s, k.Interface())
    }
    return s
}
```


## 內容來源

- [when-generics](https://go.dev/blog/when-generics)
