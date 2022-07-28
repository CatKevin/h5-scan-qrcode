<template>
  <div>
    <div class="home" v-if="toScanQrcodeFlag!=true">
      <i class="banner"></i>
      <div class="tips">
        <p class="tips_title">核酸检测信息统计</p>
        <p class="tips_descript">仅用于组织单位内部使用</p>
        <button @click="exportFirstFile"  v-if="importFileFlag==true">导出已做核酸数据</button>
        <button @click="exportSecondFile"  v-if="importFileFlag==true">导出未做核酸数据</button>
      </div>
      <button class="button" v-if="importFileFlag==true" @click="toScanQrcode">识别粤核酸码</button>
      <div class="flex-display" v-if="importFileFlag==false" >
        <div class="left-box">上传员工数据：</div>
        <input type="file" v-on:change="onChange" class="file-ipt" />
      </div>
      <div class="flex-display" v-if="importFileFlag==true" >
        <div class="centre-box">核酸检测进度：{{donePeopleNum}}人 / {{tableData[0].length}}人</div>
      </div>
    </div>

    <div class="scan"  v-else>
      <div class="nav">
        <a class="close" @click="returnToHome"></a>
        <p class="title">粤核酸码扫码</p>
      </div>
      <div class="scroll-container">
        <Scaner
          v-on:code-scanned="codeScanned"
          v-on:error-captured="errorCaptured"
          :stop-on-scanned="true"
          :draw-on-found="true"
          :responsive="false"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { read, utils } from "xlsx"; // 注意处理方法引入方式
import Scaner from '../components/Scaner';
import excelUtil from '@/utils/ExcelUtils.js';

export default {
  name: 'Home',
  components: {
    Scaner
  },
  data () {
    return {
     importFileFlag:false,
     toScanQrcodeFlag:false,
      fileList: [], //上传文件列表
      tableHead: [], //表头
      tableData: [], // 表数据
      errorMessage: "",
      scanned: "",
      database:{},
      donePeopleNum:0,
      donePeopleObj:{},
      qrcodeIsUsed:{},
    }
  },
  created() {
    this.fileList = []
    this.tableHead = []
    this.tableData = []
    this.qrcodeIsUsed = {}
    this.donePeopleNum = 0
  },
  mounted () {
    var str = navigator.userAgent.toLowerCase(); 
    var ver = str.match(/cpu iphone os (.*?) like mac os/);
    if (ver && ver[1].replace(/_/g,".") < '10.3.3') {
     alert('相机调用失败');
    }
  },
  methods: {
    returnToHome(){
      this.toScanQrcodeFlag = false
    },
    toScanQrcode(){
      this.toScanQrcodeFlag = true
      console.log(this.toScanQrcodeFlag)
    },
    codeScanned(code) {
      this.scanned = code;
      setTimeout(() => {
        // alert(`扫码解析成功: ${code}`);
        if(!this.qrcodeIsUsed[this.database[code].qrcode]){
          let myDate = new Date()
          this.donePeopleObj[this.donePeopleNum] = {
            name:this.database[code].name,
            department:this.database[code].department,
            time:myDate.toLocaleString(),
            qrcode:this.database[code].qrcode
          }
          this.qrcodeIsUsed[this.database[code].qrcode] = true
          this.donePeopleNum = this.donePeopleNum + 1
          alert(`扫码解析成功: ${this.database[code]!=null?this.database[code].name+"-"+this.database[code].department:"无数据"}`);
        }else{
          alert(`已解析过了: ${this.database[code]!=null?this.database[code].name+"-"+this.database[code].department:"无数据"}`);
        }
      }, 200)
    },
    errorCaptured(error) {
      switch (error.name) {
        case "NotAllowedError":
          this.errorMessage = "Camera permission denied.";
          break;
        case "NotFoundError":
          this.errorMessage = "There is no connected camera.";
          break;
        case "NotSupportedError":
          this.errorMessage =
            "Seems like this page is served in non-secure context.";
          break;
        case "NotReadableError":
          this.errorMessage =
            "Couldn't access your camera. Is it already in use?";
          break;
        case "OverconstrainedError":
          this.errorMessage = "Constraints don't match any installed camera.";
          break;
        default:
          this.errorMessage = "UNKNOWN ERROR: " + error.message;
      }
      console.error(this.errorMessage);
     alert('相机调用失败');
    },
    onChange(e) {
      const self = this;
      const file = e.target.files[0];
      const fileReader = new FileReader();

      fileReader.onload = ev => {
        try {
          const data = ev.target.result;
          const workbook = read(data, { type: "binary" });
          const params = [];
          // 取对应表生成json表格内容
          workbook.SheetNames.forEach(item => {
            params.push({
              name: item,
              dataList: utils.sheet_to_json(workbook.Sheets[item])
            });
            this.tableData.push(utils.sheet_to_json(workbook.Sheets[item]));
          });
          console.log(this.tableData)
          for(let i=0; i<this.tableData[0].length;i++) {
            this.database[this.tableData[0][i].粤核酸码] = {
              name:this.tableData[0][i].姓名,
              department:this.tableData[0][i].部门,
            }
          }
          console.log(this.database)
          // 该算法仅针对表头无合并的情况
          if (this.tableData.length > 0) {
            // 获取excel中第一个表格数据tableData[0][0]，并且将表头提取出来
            for (const key in this.tableData[0][0]) {
              this.tableHead.push(key);
            }
          }
          self.importFileFlag = true
          return params;
          // 重写数据
        } catch (e) {
          console.log("error:" + e);
          return false;
        }
      };
      fileReader.readAsBinaryString(file);
    },
    exportFirstFile(){
      const initColumn = [{
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        className: 'text-monospace'
      }, {
        title: '部门',
        dataIndex: 'department',
        key: 'department'
      },{
        title: '日期',
        dataIndex: 'time',
        key: 'time'
      }, {
        title: '粤核酸码',
        dataIndex: 'qrcode',
        key: 'qrcode'
      },]

      let doneList = []
      for(let i=0; i<this.donePeopleNum; i++){
        doneList.push(this.donePeopleObj[i])
      }
      excelUtil.exportExcel(initColumn, doneList, '已登记人员名单.xlsx')
    },
    exportSecondFile(){
      const initColumn = [{
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        className: 'text-monospace'
      }, {
        title: '部门',
        dataIndex: 'department',
        key: 'department'
      },{
        title: '粤核酸码',
        dataIndex: 'qrcode',
        key: 'qrcode'
      },]

      let doneList = []
      for(let i=0; i<this.tableData[0].length; i++){
        if(!this.qrcodeIsUsed[this.tableData[0][i].粤核酸码]){
          doneList.push(this.tableData[0][i])
        }
      }
      excelUtil.exportExcel(initColumn, doneList, '未登记人员名单.xlsx')
    },
  }
}
</script>

<style lang="css" scoped>
.scan {
  height: 100%;
  width: 100%;
}
.scan .nav {
  width: 100%;
  height: 48px;
  line-height: 48px;
  position: fixed;
  top: 0;
  left: 0;
}
.scan .nav .title {
  padding: 0;
  margin: 0;
  font-size: 16px;
  color: #FFFFFF;
}
.scan .nav .close {
  display: inline-block;
  height: 22px;
  width: 22px;
  background: url('../assets/back.png') no-repeat center;
  background-size: auto 100%;
  position: absolute;
  left: 16px;
  top: 14px;
}
</style>

<style>
.home {
  height: 100vh;
  background: #5F68E8;
  position: relative;
}
.home .banner {
  display: inline-block;
  width: 100%;
  height: 0px;
  padding-top: 150%;
  background: url('../assets/bg.png') no-repeat center;
  background-size: auto 100%;
  animation: move 5s ease-in-out infinite;
  animation-fill-mode: both;
}
.tips {
  width: 100%;
  position: absolute;
  bottom: 180px;
  left: 0;
  padding-top: 400px;
  color: #FFFFFF;
}
.tips p {
  padding: 0;
  margin: 0;
}
.tips .tips_title {
  font-size: 32px;
  font-weight: bold;
  text-shadow: 0px 1px 1px rgba(0, 0, 0, .15);
}
.tips .tips_descript {
  font-size: 20px;
  padding-top: 12px;
}
.button {
  height: 56px;
  width: 246px;
  line-height: 56px;
  background: url('../assets/button.png') no-repeat center;
  background-size: 100% 100%;
  position: absolute;
  bottom: 72px;
  left: 50%;
  margin-left: -123px;
  outline: none;
  border: none;
  -webkit-appearance: none;
  user-select: none;
  color: #FFFFFF;
  font-size: 18px;
  filter: drop-shadow(1px 1px 5px rgba(0, 0, 0, .25));
}

@keyframes move {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(36px);
  }
  100% {
    transform: translateY(0px);
  }
}

.flex-display {
  margin: 50px 30px;
  width: 100%;
  display: flex;
  justify-content: flex-start;
}

.left-box {
    margin: 20 30;
    height: 36px;
    line-height: 36px;
    color:white;
  }
  .centre-box {
    margin: auto;
    height: 36px;
    line-height: 36px;
    color:white;
  }
.file-ipt {
  width: 200px;
  height: 36px;
  line-height: 36px;
}

input #file-upload-button {
  background-color: #409eff;
}
</style>
