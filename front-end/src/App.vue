<template>
  <div class="container">
    <el-page-header class="header" :icon="ArrowLeft" @back="handleBack" :disabled="isRoot">
      <template #title>
        返回上一级
      </template>
      <template #breadcrumb>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-for="(item, index) in pathShowList" :key="index">{{ item }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>
      <template #content>
        <span class="text-large font-600 mr-3"> Title </span>
      </template>
    </el-page-header>
    
    <el-table :data="files" class="table">
      <el-table-column prop="name" label="文件名" />
      <el-table-column prop="time" label="创建时间" />
      <el-table-column prop="size" label="文件大小" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button v-if="row.isFile" @click="handleDownloadFile(row)" type="primary" plain>下载</el-button>
          <el-button v-else @click="handleFetchFiles(row)" type="primary" plain>打开</el-button>
          <el-button @click="handleDelete(row)" type="danger" plain>删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <form :action="`${serverOrigin}/upload?path=${path}`" method="post" enctype="multipart/form-data">
      <input type="file" name="files" multiple>
      <!-- <input type="file" name="file"> -->
      <button type="submit">Upload</button>
    </form>

    <div>
      <input type="text" v-model="newDirName">
      <el-button @click="handlCreateDir">新建文件夹</el-button>
    </div>

    <button @click="handleBack" :disabled="isRoot">返回上一级</button>
    <p>当前路径：{{ pathShowList.join('/') }}</p>
  </div>
</template>

<script setup>
// import { io } from "socket.io-client"
import axios from 'axios'
import { onBeforeMount, ref, computed } from "vue"
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

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
    files.value = fileList
  })
}

// 下载文件
const handleDownloadFile = (file) => {
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
    ElMessage('已经是第一级目录啦')
    return
  }

  const pathList = path.value.split('/')
  path.value = pathList.slice(0, pathList.length - 1).join('/')

  handleFetchFiles()
}

// 新建文件夹
const newDirName = ref('')
const handlCreateDir = () => {
  axios.post('/createNewDir', {
    path: encodeURIComponent(path.value + `/${newDirName.value}`)
  }).then(res => {
    handleFetchFiles()
    newDirName.value = ''
  })
}

// 删除目录/文件
const handleDelete = (file) => {
  axios.delete('/deleteFile', {
    params: {
      path: encodeURIComponent(path.value),
      fileName: file.name
    }
  }).then(res => {
    handleFetchFiles()
  })
}

onBeforeMount(() => {
  handleFetchFiles()
})
</script>

<style scoped lang="less">
.container {
  padding: 20px;
  background-color: #f2f2f2;

  .header {
    padding: 20px;
    margin-bottom: 20px;
    background-color: #fff;
    border-radius: 10px;
  }

  .table {
    box-sizing: border-box;
    padding: 20px;
    border-radius: 10px;
  }
}
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 700px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid #ddd;
  text-align: left;
}
</style>
