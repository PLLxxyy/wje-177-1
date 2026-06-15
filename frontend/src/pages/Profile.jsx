import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

const categories = ['上衣', '裤子', '裙子', '外套', '鞋子', '配饰', '其他']
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '均码', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44']

const Profile = () => {
  const [activeTab, setActiveTab] = useState('published')
  const [myClothes, setMyClothes] = useState([])
  const [receivedRequests, setReceivedRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [swapRecords, setSwapRecords] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [showWishModal, setShowWishModal] = useState(false)
  const [wishForm, setWishForm] = useState({ category: '', brand: '', size: '', keyword: '' })
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewData, setReviewData] = useState({ swapId: null, rating: 5, content: '' })
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const fetchMyClothes = async () => {
    try {
      const res = await api.get('/api/clothes', { params: { user_id: user.id, status: '', limit: 100 } })
      setMyClothes(res.data.list)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchReceivedRequests = async () => {
    try {
      const res = await api.get('/api/swap-requests/received')
      setReceivedRequests(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchSentRequests = async () => {
    try {
      const res = await api.get('/api/swap-requests/sent')
      setSentRequests(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchSwapRecords = async () => {
    try {
      const res = await api.get('/api/swap-records')
      setSwapRecords(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/api/wishlist')
      setWishlist(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchMyClothes()
    fetchReceivedRequests()
    fetchSentRequests()
    fetchSwapRecords()
    fetchWishlist()
  }, [user, activeTab])

  const handleAccept = async (id) => {
    try {
      await api.post(`/api/swap-requests/${id}/accept`)
      alert('已通过申请')
      fetchReceivedRequests()
    } catch (e) {
      alert(e.response?.data?.error || '操作失败')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.post(`/api/swap-requests/${id}/reject`)
      alert('已拒绝申请')
      fetchReceivedRequests()
    } catch (e) {
      alert(e.response?.data?.error || '操作失败')
    }
  }

  const handleConfirmSwap = async (id) => {
    if (!confirm('确认已完成线下交换？')) return
    try {
      const res = await api.post(`/api/swap-requests/${id}/confirm`)
      alert(res.data.completed ? '双方已确认，交换完成！' : '已确认，等待对方确认')
      fetchSwapRecords()
      fetchReceivedRequests()
      fetchSentRequests()
    } catch (e) {
      alert(e.response?.data?.error || '操作失败')
    }
  }

  const handleAddWish = async () => {
    if (!wishForm.category && !wishForm.brand && !wishForm.size && !wishForm.keyword) {
      alert('请至少填写一个条件')
      return
    }
    try {
      await api.post('/api/wishlist', wishForm)
      alert('添加成功')
      setShowWishModal(false)
      setWishForm({ category: '', brand: '', size: '', keyword: '' })
      fetchWishlist()
    } catch (e) {
      alert(e.response?.data?.error || '添加失败')
    }
  }

  const handleDeleteWish = async (id) => {
    if (!confirm('确定删除？')) return
    try {
      await api.delete(`/api/wishlist/${id}`)
      fetchWishlist()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmitReview = async () => {
    try {
      await api.post('/api/reviews', {
        swap_request_id: reviewData.swapId,
        rating: reviewData.rating,
        content: reviewData.content
      })
      alert('评价成功')
      setShowReviewModal(false)
      fetchSwapRecords()
    } catch (e) {
      alert(e.response?.data?.error || '评价失败')
    }
  }

  const getStatusText = (status) => {
    const map = {
      pending: '待审核',
      approved: '已上架',
      rejected: '已驳回',
      accepted: '待交换',
      rejected_swap: '已拒绝',
      completed: '已完成'
    }
    return map[status] || status
  }

  const getStatusColor = (status) => {
    const map = {
      pending: '#faad14',
      approved: '#52c41a',
      rejected: '#ff4d4f',
      accepted: '#1890ff',
      completed: '#52c41a'
    }
    return map[status] || '#999'
  }

  const getRequestStatusText = (status) => {
    const map = {
      pending: '待处理',
      accepted: '已同意',
      rejected: '已拒绝',
      completed: '已完成'
    }
    return map[status] || status
  }

  if (!user) return null

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '32px auto',
      padding: '0 24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '32px'
        }}>
          {user.nickname?.[0] || user.username?.[0]}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>{user.nickname || user.username}</h2>
          <p style={{ color: '#999', fontSize: '14px' }}>@{user.username}</p>
          {user.role === 'admin' && (
            <span style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '2px 8px',
              background: '#fff7e6',
              color: '#fa8c16',
              borderRadius: '4px',
              fontSize: '12px'
            }}>管理员</span>
          )}
        </div>
        <button
          onClick={logout}
          style={{
            padding: '8px 20px',
            border: '1px solid #ddd',
            background: 'white',
            borderRadius: '20px',
            color: '#666',
            fontSize: '14px'
          }}
        >退出登录</button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {[
            { key: 'published', label: '我发布的' },
            { key: 'received', label: '收到的申请' },
            { key: 'sent', label: '发出的申请' },
            { key: 'records', label: '交换记录' },
            { key: 'wishlist', label: '心愿单' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '16px',
                background: 'none',
                border: 'none',
                fontSize: '15px',
                color: activeTab === tab.key ? '#667eea' : '#666',
                fontWeight: activeTab === tab.key ? 500 : 'normal',
                borderBottom: activeTab === tab.key ? '2px solid #667eea' : '2px solid transparent',
                marginBottom: '-1px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'published' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px' }}>我的闲置衣物</h3>
                <button
                  onClick={() => navigate('/publish')}
                  style={{
                    padding: '8px 20px',
                    background: '#667eea',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}
                >+ 发布新衣物</button>
              </div>
              {myClothes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                  <p>还没有发布的衣物</p>
                  <button
                    onClick={() => navigate('/publish')}
                    style={{ marginTop: '16px', padding: '10px 24px', background: '#667eea', color: 'white', borderRadius: '20px', fontSize: '14px' }}
                  >去发布</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {myClothes.map(item => (
                    <Link to={`/clothes/${item.id}`} key={item.id} style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #f0f0f0',
                      display: 'block'
                    }}>
                      <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#f5f5f5' }}>
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : null}
                      </div>
                      <div style={{ padding: '10px' }}>
                        <p style={{
                          fontSize: '13px',
                          color: '#333',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>{item.title}</p>
                        <span style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: 'white',
                          background: getStatusColor(item.status)
                        }}>{getStatusText(item.status)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>收到的交换申请</h3>
              {receivedRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                  <p>暂无收到的申请</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {receivedRequests.map(req => (
                    <div key={req.id} style={{
                      padding: '16px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {req.from_nickname?.[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 500 }}>{req.from_nickname}</p>
                          <p style={{ fontSize: '12px', color: '#999' }}>
                            {new Date(req.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            margin: '0 auto 6px'
                          }}>
                            {req.offered_images?.[0] && (
                              <img src={req.offered_images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                          <p style={{ fontSize: '12px', color: '#666' }}>对方的</p>
                          <p style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{req.offered_title}</p>
                        </div>
                        <span style={{ fontSize: '20px', color: '#ddd' }}>⇄</span>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            margin: '0 auto 6px'
                          }}>
                            {req.target_images?.[0] && (
                              <img src={req.target_images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                          <p style={{ fontSize: '12px', color: '#666' }}>我的</p>
                          <p style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{req.target_title}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: 'white',
                          background: getStatusColor(req.status)
                        }}>{getRequestStatusText(req.status)}</span>
                        {req.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleAccept(req.id)}
                              style={{
                                padding: '6px 16px',
                                background: '#52c41a',
                                color: 'white',
                                borderRadius: '16px',
                                fontSize: '13px'
                              }}
                            >通过</button>
                            <button
                              onClick={() => handleReject(req.id)}
                              style={{
                                padding: '6px 16px',
                                background: '#ff4d4f',
                                color: 'white',
                                borderRadius: '16px',
                                fontSize: '13px'
                              }}
                            >拒绝</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>发出的交换申请</h3>
              {sentRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                  <p>暂无发出的申请</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sentRequests.map(req => (
                    <div key={req.id} style={{
                      padding: '16px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {req.to_nickname?.[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 500 }}>发给 {req.to_nickname}</p>
                          <p style={{ fontSize: '12px', color: '#999' }}>
                            {new Date(req.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            margin: '0 auto 6px'
                          }}>
                            {req.offered_images?.[0] && (
                              <img src={req.offered_images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                          <p style={{ fontSize: '12px', color: '#666' }}>我拿出的</p>
                          <p style={{ fontSize: '12px' }}>{req.offered_title}</p>
                        </div>
                        <span style={{ fontSize: '20px', color: '#ddd' }}>→</span>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            margin: '0 auto 6px'
                          }}>
                            {req.target_images?.[0] && (
                              <img src={req.target_images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                          <p style={{ fontSize: '12px', color: '#666' }}>想要的</p>
                          <p style={{ fontSize: '12px' }}>{req.target_title}</p>
                        </div>
                      </div>

                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: 'white',
                        background: getStatusColor(req.status)
                      }}>{getRequestStatusText(req.status)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'records' && (
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>我的交换记录</h3>
              {swapRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                  <p>暂无交换记录</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {swapRecords.map(record => {
                    const isFromUser = record.from_user_id === user.id
                    const otherNickname = isFromUser ? record.to_nickname : record.from_nickname
                    return (
                      <div key={record.id} style={{
                        padding: '16px',
                        border: '1px solid #f0f0f0',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {otherNickname?.[0]}
                        </div>

                        <div style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '20px'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              margin: '0 auto 4px'
                            }}>
                              {record.offered_images?.[0] && (
                                <img src={record.offered_images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </div>
                            <p style={{ fontSize: '11px', color: '#666' }}>我{isFromUser ? '拿出' : '收到'}</p>
                          </div>
                          <span style={{ fontSize: '18px', color: '#ddd' }}>⇄</span>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              margin: '0 auto 4px'
                            }}>
                              {record.target_images?.[0] && (
                                <img src={record.target_images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </div>
                            <p style={{ fontSize: '11px', color: '#666' }}>我{isFromUser ? '收到' : '拿出'}</p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: 'white',
                            background: getStatusColor(record.status)
                          }}>{getRequestStatusText(record.status)}</span>
                          {record.status === 'accepted' && (
                            <button
                              onClick={() => handleConfirmSwap(record.id)}
                              style={{
                                padding: '6px 16px',
                                background: '#52c41a',
                                color: 'white',
                                borderRadius: '16px',
                                fontSize: '13px'
                              }}
                            >确认交换完成</button>
                          )}
                          {record.status === 'completed' && (
                            <button
                              onClick={() => {
                                setReviewData({ swapId: record.id, rating: 5, content: '' })
                                setShowReviewModal(true)
                              }}
                              style={{
                                padding: '6px 16px',
                                background: '#1890ff',
                                color: 'white',
                                borderRadius: '16px',
                                fontSize: '13px'
                              }}
                            >去评价</button>
                          )}
                          {record.completed_at && (
                            <p style={{ fontSize: '11px', color: '#999' }}>
                              {new Date(record.completed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px' }}>我的心愿单</h3>
                <button
                  onClick={() => setShowWishModal(true)}
                  style={{
                    padding: '8px 20px',
                    background: '#667eea',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}
                >+ 添加心愿</button>
              </div>
              {wishlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                  <p>还没有心愿单</p>
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>添加心愿后，有匹配的新衣物会推荐给你</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {wishlist.map(item => (
                    <div key={item.id} style={{
                      padding: '16px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '12px',
                      position: 'relative'
                    }}>
                      <button
                        onClick={() => handleDeleteWish(item.id)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'none',
                          color: '#ccc',
                          fontSize: '18px',
                          padding: '4px'
                        }}
                      >×</button>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {item.category && (
                          <span style={{
                            padding: '4px 10px',
                            background: 'rgba(102, 126, 234, 0.1)',
                            color: '#667eea',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>{item.category}</span>
                        )}
                        {item.brand && (
                          <span style={{
                            padding: '4px 10px',
                            background: '#f0f0f0',
                            color: '#666',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>品牌: {item.brand}</span>
                        )}
                        {item.size && (
                          <span style={{
                            padding: '4px 10px',
                            background: '#f0f0f0',
                            color: '#666',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>尺码: {item.size}</span>
                        )}
                        {item.keyword && (
                          <span style={{
                            padding: '4px 10px',
                            background: '#fff0f6',
                            color: '#eb2f96',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>关键词: {item.keyword}</span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
                        {new Date(item.created_at).toLocaleDateString()} 添加
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showWishModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowWishModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '450px',
            padding: '24px'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>添加心愿</h2>
            <p style={{ color: '#999', fontSize: '13px', marginBottom: '20px' }}>
              设置你想要的衣物条件，有匹配的新发布时会提醒你
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>分类</label>
              <select
                value={wishForm.category}
                onChange={(e) => setWishForm(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">不限</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>品牌</label>
              <input
                type="text"
                value={wishForm.brand}
                onChange={(e) => setWishForm(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="如：Nike"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>尺码</label>
              <select
                value={wishForm.size}
                onChange={(e) => setWishForm(prev => ({ ...prev, size: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">不限</option>
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>关键词</label>
              <input
                type="text"
                value={wishForm.keyword}
                onChange={(e) => setWishForm(prev => ({ ...prev, keyword: e.target.value }))}
                placeholder="如：卫衣、牛仔"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowWishModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f5f5f5',
                  color: '#666',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >取消</button>
              <button
                onClick={handleAddWish}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >添加</button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowReviewModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '400px',
            padding: '24px'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>评价这次交换</h2>

            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>评分</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                    style={{
                      fontSize: '32px',
                      background: 'none',
                      color: reviewData.rating >= star ? '#faad14' : '#ddd'
                    }}
                  >★</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>评价内容（选填）</label>
              <textarea
                value={reviewData.content}
                onChange={(e) => setReviewData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="分享你的交换体验..."
                rows={4}
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
                onClick={() => setShowReviewModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f5f5f5',
                  color: '#666',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >取消</button>
              <button
                onClick={handleSubmitReview}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >提交评价</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
