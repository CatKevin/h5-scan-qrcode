import {writeFile} from 'xlsx';

/**   注意：导出的时候，headers中的key值 与data 中每一个item的属性名一一对应，最终表格显示的是data的每一个item的属性值。
 * 导出Excel的处理函数--针对table
 * @param {Array} headers: [{key: 'name', title: '姓名'}, {key: 'grad', title: '年级'},{key:'department',title:'部门'}]
 * @param {Array} data   : [{ name: '张三', grade: '2017级',department:'前端部门'},{ name: '李四', grade: '2017级',department:'java部门'}]
 * @param {String} fileName: '导出结果.xlsx' // 默认的文件名
 * */

function exportExcel (headers, data, fileName = '导出结果.xlsx') {
  const _headers = headers
    .map((item, i) => Object.assign({}, { key: item.key, title: item.title, position: String.fromCharCode(65 + i) + 1 }))
    .reduce((prev, next) => Object.assign({}, prev, { [next.position]: { key: next.key, v: next.title } }), {})

  const _data = data
    .map((item, i) => headers.map((key, j) => Object.assign({}, { content: item[key.key], position: String.fromCharCode(65 + j) + (i + 2) })))
  // 对刚才的结果进行降维处理（二维数组变成一维数组）
    .reduce((prev, next) => prev.concat(next))
  // 转换成 worksheet 需要的结构
    .reduce((prev, next) => Object.assign({}, prev, { [next.position]: { v: next.content } }), {})

  // 合并 headers 和 data
  const output = Object.assign({}, _headers, _data)
  // 获取所有单元格的位置
  const outputPos = Object.keys(output)
  // 计算出范围 ,["A1",..., "H2"]
  const ref = `${outputPos[0]}:${outputPos[outputPos.length - 1]}`

  // 构建 workbook 对象
  const wb = {
    SheetNames: ['mySheet'],
    Sheets: {
      mySheet: Object.assign(
        {},
        output,
        {
          '!ref': ref,
          '!cols': [{ wpx: 45 }, { wpx: 100 }, { wpx: 200 }, { wpx: 80 }, { wpx: 150 }, { wpx: 100 }, { wpx: 300 }, { wpx: 300 }]
        }
      )
    }
  }
  // 导出 Excel
  writeFile(wb, fileName)
}
export default { exportExcel }
