import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

const Detail = () => {
  const { id } = useParams()
  const [clothes, setClothes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [myClothes, setMyClothes] = useState([])
  const [selectedClothes, setSelectedClothes] = useState(null)
  const [swapMessage, setSwapMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`/api/clothes/${id}`)
      setClothes(res.data)
    } catch (e) {
      alert('衣物不存在')
      navigate('/')
    }
    setLoading(false)
  }

  const fetchMyClothes = async () => {
    if (!user) return
    try {
      const res = await api.get('/api/clothes', { params: { user_id: user.id, status: 'approved', limit: 100 } })
      setMyClothes(res.data.list)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchDetail()
    fetchMyClothes()
  }, [id, user])

  const handleSwap = async () => {
    if (!selectedClothes) {
      alert('请选择要交换的衣物')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/swap-requests', {
        target_clothes_id: clothes.id,
        offered_clothes_id: selectedClothes.id,
        message: swapMessage
      })
      alert('交换申请已发送')
      setShowSwapModal(false)
      navigate('/profile')
    } catch (e) {
      alert(e.response?.data?.error || '发送失败')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: '#999' }}>加载中...</div>
    )
  }

  if (!clothes) return null

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '32px auto',
      padding: '0 24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        display: 'flex'
      }}>
        <div style={{ width: '55%', background: '#f5f5f5' }}>
          <div style={{
            width: '100%',
            aspectRatio: '1',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {clothes.images && clothes.images.length > 0 ? (
              <img
                src={clothes.images[currentImageIndex]}
                alt={clothes.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                暂无图片
              </div>
            )}
          </div>
          {clothes.images && clothes.images.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              overflowX: 'auto'
            }}>
              {clothes.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: currentImageIndex === index ? '2px solid #667eea' : '2px solid transparent',
                    padding: 0,
                    flexShrink: 0
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: '45%', padding: '32px' }}>
          <h1 style={{ fontSize: '22px', marginBottom: '12px', color: '#333' }}>{clothes.title}</h1>

          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}>
            <span style={{
              padding: '4px 12px',
              background: 'rgba(102, 126, 234, 0.1)',
              color: '#667eea',
              borderRadius: '12px',
              fontSize: '13px'
            }}>{clothes.category}</span>
            <span style={{
              padding: '4px 12px',
              background: '#f0f0f0',
              color: '#666',
              borderRadius: '12px',
              fontSize: '13px'
            }}>{clothes.condition}</span>
          </div>

          <div style={{
            background: '#fafafa',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px', fontSize: '14px' }}>
              <span style={{ color: '#999' }}>品牌</span>
              <span style={{ color: '#333' }}>{clothes.brand || '未填写'}</span>
              <span style={{ color: '#999' }}>尺码</span>
              <span style={{ color: '#333' }}>{clothes.size}</span>
              <span style={{ color: '#999' }}>分类</span>
              <span style={{ color: '#333' }}>{clothes.category}</span>
              <span style={{ color: '#999' }}>成色</span>
              <span style={{ color: '#333' }}>{clothes.condition}</span>
            </div>
          </div>

          {clothes.wanted_types && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>期望交换</h3>
              <p style={{ fontSize: '14px', color: '#333', background: '#fff7e6', padding: '10px 12px', borderRadius: '6px' }}>
                💡 {clothes.wanted_types}
              </p>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>卖家描述</h3>
            <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.6 }}>
              {clothes.description || '暂无描述'}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 0',
            borderTop: '1px solid #f0f0f0',
            borderBottom: '1px solid #f0f0f0',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              {clothes.seller_nickname?.[0] || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, color: '#333' }}>{clothes.seller_nickname}</p>
              <p style={{ fontSize: '12px', color: '#999' }}>
                {new Date(clothes.created_at).toLocaleDateString()} 发布
              </p>
            </div>
          </div>

          {user && user.id !== clothes.user_id ? (
            <button
              onClick={() => setShowSwapModal(true)}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              我想换
            </button>
          ) : user ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '14px' }}>这是你发布的衣物</p>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              登录后发起交换
            </button>
          )}
        </div>
      </div>

      {showSwapModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowSwapModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '24px'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>发起交换申请</h2>

            <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>选择你要拿出交换的衣物：</p>
            
            {myClothes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#999'
              }}>
                <p>你还没有发布的衣物</p>
                <button
                  onClick={() => navigate('/publish')}
                  style={{
                    marginTop: '12px',
                    padding: '8px 20px',
                    background: '#667eea',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '13px'
                  }}
                >
                  去发布
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {myClothes.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedClothes(item)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: selectedClothes?.id === item.id ? '2px solid #667eea' : '2px solid #eee',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden' }}>
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#f5f5f5' }} />
                      )}
                    </div>
                    <p style={{
                      padding: '8px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{item.title}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666' }}>留言（选填）</label>
              <textarea
                value={swapMessage}
                onChange={(e) => setSwapMessage(e.target.value)}
                placeholder="可以写一些想对卖家说的话"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSwapModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >
                取消
              </button>
              <button
                onClick={handleSwap}
                disabled={!selectedClothes || submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  opacity: !selectedClothes || submitting ? 0.6 : 1
                }}
              >
                {submitting ? '发送中...' : '发送申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Detail
