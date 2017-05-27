# html5-signature
本工具基于html5 canvas标签实现签名面板功能，通过监听canvas上的mouse和touch事件，动态绘制图形，实时还原笔记，并最终导出byte[]

## 什么是 Canvas

HTML5 <canvas> 标签定义图形，比如图表和其他图像。HTML5 <canvas> 元素用于图形的绘制，通过脚本 (通常是JavaScript)来完成.

<canvas> 标签只是图形容器，您必须使用脚本来绘制图形。

## 浏览器支持

表格中的数字表示支持 <canvas> 元素的第一个浏览器版本号。

| 元素       | Chrome | IE   | Firefox | Safari | Opera |
| -------- | ------ | ---- | ------- | ------ | ----- |
| <canvas> | 4.0    | 9.0  | 2.0     | 3.1    | 9.0   |

## Demo

```javascript
<script>
        $(function() {
            $("#btnSignature").click(function() {
                $.signature(function(orgValue) {
                    // value is not null when signatured
                    if (orgValue) {
                        $("#imgSignature").attr("src", orgValue);
                    }
                });
            });
        });
</script>
```

