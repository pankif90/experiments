experiments
===========

Работы с web worker
### Методы
Метод|Синтаксис|Возвращаемое значение|Описание
------|------|:---------:|-----------
setFilter|`setFilter(function(item): Boolean)`|`this`| Установить ф-ция для фильтрации объектов перед рендерингом. Единственный аргумент - ф-ция, которая принимает объект из слоя и возвращает булево значение (`false` - отфильтровать)
bindPopup|`bindPopup(html <String> `&#124;` el <HTMLElement> `&#124;` popup <Popup>, options <Popup options>? )`||
setDateInterval|`setDateInterval(beginDate, endDate)`|`this`|Задаёт временной интервал для мультиврменных слоёв. Только объекты из этого интервала будут загружены и показаны на карте. `beginDate` и `endDate` имеют тип `Date`.
addTo|`addTo(map)`|`this`|Добавить слой на карту. Аргемент `map` имеет тип `L.Map`.