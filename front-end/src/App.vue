<template>
  <div class="container">
    <el-page-header class="header" :icon="ArrowLeft" @back="handleBack" :disabled="isRoot">
      <template #title>
        Back
      </template>
      <template #breadcrumb>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-for="(item, index) in pathShowList" :key="index">{{ item }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>
      <template #content>
        <div class="action-bar">
          <el-button type="primary" @click="drawerVisible = true" :icon="Upload">Upload files</el-button>
          <el-input
            v-model.trim="newDirName"
            placeholder="Please input folder name"
            style="margin-left: 20px; margin-right: 5px;"
          />
          
          <el-button type="primary" @click="handlCreateDir" :icon="FolderAdd">New folder</el-button>
        </div>
      </template>
    </el-page-header>
    
    <div class="table-box">
      <el-table :data="files">
        <el-table-column prop="name" label="File/Folder name">
          <template #default="{ row }">
            <div class="file">
              <img :src="getAssets(`svg/${row.icon}`)" class="icon" />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="Created time" />
        <el-table-column prop="size" label="File size" />
        <el-table-column label="Operations">
          <template #default="{ row }">
            <el-button v-if="row.isFile" @click="handleDownloadFile(row)" type="primary" link :icon="Download">Download</el-button>
            <el-button v-else @click="handleFetchFiles(row)" type="primary" link :icon="FolderOpened">Open</el-button>
            <el-button v-if="getIsImg(row.name)" @click="previewImg(row)" type="primary" link :icon="Picture">Preview</el-button>
            <el-button @click="handleDelete(row)" type="danger" link :icon="Delete">Delete</el-button>
          </template>
        </el-table-column>
    </el-table>
    </div>

    <el-drawer
      v-model="drawerVisible"
      title="Upload files"
      direction="rtl"
    >
      <el-upload
        drag
        multiple
        name="files"
        :on-success="handleSuccess"
        :action="`${serverOrigin}/upload?path=${path}`"
        :headers="{
          enctype: 'multipart/form-data'
        }"
      >
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          Drop file here or <em>click to upload</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            <el-alert title="A single file size should not more than 20M." type="warning" show-icon />
          </div>
          <div class="el-upload__tip">
            <el-alert title="When file is uploading, and then close current drawer, the file will uploading continue." type="warning" show-icon />
          </div>
        </template>
      </el-upload>
    </el-drawer>
  </div>
</template>

<script setup>
// import { io } from "socket.io-client"
import axios from 'axios'
import { onBeforeMount, ref, computed } from "vue"
import { ArrowLeft, UploadFilled, Upload, Download, Delete, FolderOpened, FolderAdd, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAssets } from '@/utils'

const serverOrigin = import.meta.env.VITE_SERVER_ORIGIN

// const socket = io.connect(serverOrigin)

// socket.on('progress', (data) => {
//   const progress = data.progress
  
//   console.log('progress', progress)
// })

const isRoot = ref(true)
const path = ref('')
const files = ref([])
const pathShowList = computed(() => {
  const list = path.value.split('/').slice(2)
  list.unshift('root')
  return list
})

// 获取目录内的文件及子目录
const handleFetchFiles = (file = {}) => {
  const { isFile, name } = file
  
  if (isFile === false) {
    path.value = path.value + `/${name}`
  }
  
  axios.get('/getFilesList', {
    params: {
      path: encodeURIComponent(path.value)
    }
  }).then(res => {
    const { isRootPath, curPath, fileList } = res.data.data

    isRoot.value = isRootPath
    path.value = curPath
    files.value = (fileList || []).map(item => {
      const { name } = item
      const icon = getIcon(name)
      return {
        ...item,
        icon
      }
    })
  })
}

// 下载文件
const handleDownloadFile = (file) => {
  ElMessage('The file is downloading, please be patient and wait')
  axios.get('/downloadFile', {
    params: {
      path: encodeURIComponent(path.value),
      fileName: file.name
    },
    responseType: 'arraybuffer' // 响应数据使用二进制编码
  }).then(res => {
    // 接收到数据流后进行转换创建一个可以直接访问的 url 对象
    const blob = new Blob([res.data], { type: 'application/octet-stream' })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    // 动态创建并设置超链接的地址来实现自动下载功能
    link.href = objectUrl
    link.setAttribute('download', file.name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })
}

// 返回上一级目录
const handleBack = () => {
  if (isRoot.value) {
    ElMessage("It's already a top-level directory")
    return
  }

  const pathList = path.value.split('/')
  path.value = pathList.slice(0, pathList.length - 1).join('/')

  handleFetchFiles()
}

// 新建文件夹
const newDirName = ref('')
const handlCreateDir = () => {
  if (!newDirName.value) {
    ElMessage("Please input a new folder name")
    return
  }

  const isExist = files.value.filter(item => !item.isFile)?.find(item => item.name === newDirName.value)
  if (isExist) {
    ElMessage(`The folder [${newDirName.value}] already exists`)
    return
  }

  axios.post('/createNewDir', {
    path: encodeURIComponent(path.value + `/${newDirName.value}`)
  }).then(res => {
    handleFetchFiles()
    newDirName.value = ''
  })
}

// 删除目录/文件
const handleDelete = (file) => {
  const { isFile, name } = file
  ElMessageBox.confirm(
    `Are you sure to delete the ${isFile ? 'file' : 'folder'} [${name}] ?`,
    'Tips',
    {
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      type: 'warning',
    }
  )
    .then(() => {
      axios.delete('/deleteFile', {
        params: {
          path: encodeURIComponent(path.value),
          fileName: file.name
        }
      }).then(res => {
        ElMessage({
            type: 'success',
            message: 'Delete completed',
          })
        handleFetchFiles()
      })
    })
    .catch(() => {})
}

const drawerVisible = ref(false)

const handleSuccess = () => {
  handleFetchFiles()
}

const getIsImg = name => (/\.(jpg|png|gif|jpeg|svg)$/i).test(name)
const previewImg = (file) => {
  const url = `${serverOrigin}/downloadFile?path=${encodeURIComponent(path.value)}&fileName=${file.name}`
  window.open(url, '_blank')
}

const getIcon = name => {
  const file = name.split('.')[1]?.toLowerCase()
  switch (file) {
    case undefined:
      return 'folder.svg'
    case 'png':
    case 'svg':
    case 'gif':
    case 'jpg':
    case 'jpeg':
      return 'pic.svg'
    case 'pdf':
      return 'pdf.svg'
    case 'mp3':
    case 'ogg':
      return 'music.svg'
    case 'ppt':
    case 'pptx':
      return 'ppt.svg'
    case 'xls':
    case 'xlsx':
      return 'excel.svg'
    case 'doc':
    case 'docx':
      return 'doc.svg'
    case 'zip':
    case 'rar':
    case 'tar':
    case '7z':
      return 'zip.svg'
    case 'mp4':
    case 'flv':
    case 'mov':
    case 'rmvb':
    case 'wmv':
    case 'avi':
      return 'video.svg'
    default:
      return 'unknow.svg'
  }
}

onBeforeMount(() => {
  handleFetchFiles()
})
</script>

<style scoped lang="less">
.container {
  box-sizing: border-box;
  height: 100vh;
  padding: 20px;
  background-color: #f2f2f2;

  .header {
    padding: 20px;
    margin-bottom: 20px;
    background-color: #fff;
    border-radius: 10px;

    .action-bar {
      display: flex;
    }
  }

  .table-box {
    padding: 20px;
    border-radius: 10px;
    background-color: #fff;

    .file {
      display: flex;
      align-items: center;

      .icon {
        width: 20px;
        height: 20px;
        margin-right: 8px;
      }
    }
  }
}
</style>
