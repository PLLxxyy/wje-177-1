import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

const categories = ['上衣', '裤子', '裙子', '外套', '鞋子', '配饰', '其他']
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '均码', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44']
const conditions = ['全新', '九成新', '八成新', '七成新', '六成新及以下']

const Publish = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brand: '',
    category: '',
    size: '',
    condition: '',
    wanted_types: ''
  })
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 9) {
      alert('最多上传9张图片')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('images', file))
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImages(prev => [...prev, ...res.data.urls])
    } catch (e) {
      alert('上传失败')
      console.error(e)
    }
    setUploading(false)
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.category || !formData.size || !formData.condition) {
      alert('请填写必要信息')
      return
    }
    if (images.length === 0) {
      alert('请至少上传一张图片')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/clothes', {
        ...formData,
        images
      })
      alert('发布成功，等待管理员审核')
      navigate('/profile')
    } catch (e) {
      alert(e.response?.data?.error || '发布失败')
    }
    setSubmitting(false)
  }

  if (!user) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '100px auto',
        textAlign: 'center',
        padding: '40px'
      }}>
        <h2>请先登录</h2>
        <button onClick={() => navigate('/login')} style={{
          marginTop: '20px',
          padding: '12px 32px',
          background: '#667eea',
          color: 'white',
          borderRadius: '25px',
          fontSize: '15px'
        }}>去登录</button>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '32px auto',
      padding: '0 24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '24px', color: '#333' }}>发布闲置衣物</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', color: '#333', fontWeight: 500 }}>
              实拍图片 <span style={{ color: '#ff4d4f' }}>*</span>
              <span style={{ color: '#999', fontWeight: 'normal', fontSize: '13px', marginLeft: '8px' }}>（最多9张，第一张为封面）</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {images.map((img, index) => (
                <div key={index} style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >×</button>
                </div>
              ))}
              {images.length < 9 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '8px',
                    border: '2px dashed #ddd',
                    background: '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: '12px'
                  }}
                >
                  <span style={{ fontSize: '24px', marginBottom: '4px' }}>+</span>
                  {uploading ? '上传中...' : '添加图片'}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500 }}>
              标题 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="一句话描述你的衣物"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '15px'
              }}
              maxLength={50}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500 }}>
                分类 <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '15px',
                  background: 'white'
                }}
              >
                <option value="">请选择分类</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500 }}>
                尺码 <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <select
                name="size"
                value={formData.size}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '15px',
                  background: 'white'
                }}
              >
                <option value="">请选择尺码</option>
                {sizes.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500 }}>品牌</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="如：Nike、Zara"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500 }}>
                成色 <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '15px',
                  background: 'white'
                }}
              >
                <option value="">请选择成色</option>
                {conditions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500 }}>
              期望交换的衣物类型
            </label>
            <input
              type="text"
              name="wanted_types"
              value={formData.wanted_types}
              onChange={handleChange}
              placeholder="例如：想换M码卫衣、牛仔外套等"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '15px'
              }}
              maxLength={100}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500 }}>
              详细描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="描述衣物的详细信息，如购买时间、穿着次数、有无瑕疵等"
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '15px',
                resize: 'vertical'
              }}
              maxLength={500}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 500,
              opacity: submitting || uploading ? 0.6 : 1
            }}
          >
            {submitting ? '发布中...' : '发布闲置'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Publish
