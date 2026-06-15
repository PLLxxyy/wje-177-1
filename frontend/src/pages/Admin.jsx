import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

const Admin = () => {
  const [activeTab, setActiveTab] = useState('review')
  const [pendingClothes, setPendingClothes] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedClothes, setSelectedClothes] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const fetchPendingClothes = async () => {
    try {
      const res = await api.get('/api/admin/clothes', { params: { status: 'pending', limit: 50 } })
      setPendingClothes(res.data.list)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats')
      setStats(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }
    fetchPendingClothes()
    fetchStats()
  }, [user, activeTab])

  const handleApprove = async (id) => {
    try {
      await api.post(`/api/admin/clothes/${id}/approve`)
      alert('已通过审核')
      fetchPendingClothes()
      fetchStats()
    } catch (e) {
      alert('操作失败')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.post(`/api/admin/clothes/${id}/reject`)
      alert('已驳回')
      fetchPendingClothes()
      fetchStats()
    } catch (e) {
      alert('操作失败')
    }
  }

  if (!user || user.role !== 'admin') return null

  const StatCard = ({ label, value, icon, color }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px'
      }}>{icon}</div>
      <div>
        <p style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>{label}</p>
        <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>{value}</p>
      </div>
    </div>
  )

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '32px auto',
      padding: '0 24px'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '24px', color: '#333' }}>管理员后台</h1>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
          {[
            { key: 'review', label: '内容审核' },
            { key: 'stats', label: '数据统计' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '16px 32px',
                background: 'none',
                border: 'none',
                fontSize: '15px',
                color: activeTab === tab.key ? '#667eea' : '#666',
                fontWeight: activeTab === tab.key ? 500 : 'normal',
                borderBottom: activeTab === tab.key ? '2px solid #667eea' : '2px solid transparent',
                marginBottom: '-1px'
              }}
            >{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'review' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px' }}>待审核衣物</h3>
                <span style={{
                  padding: '4px 12px',
                  background: '#fff7e6',
                  color: '#fa8c16',
                  borderRadius: '12px',
                  fontSize: '13px'
                }}>
                  {pendingClothes.length} 件待审核
                </span>
              </div>

              {pendingClothes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                  <p>暂无待审核内容</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {pendingClothes.map(item => (
                    <div key={item.id} style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{ cursor: 'pointer', width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#f5f5f5' }}
                        onClick={() => setSelectedClothes(item)}
                      >
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : null}
                      </div>
                      <div style={{ padding: '12px' }}>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '8px'
                        }}>{item.title}</p>
                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                          发布者：{item.seller_nickname}
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApprove(item.id)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: '#52c41a',
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '13px'
                            }}
                          >通过</button>
                          <button
                            onClick={() => handleReject(item.id)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: '#ff4d4f',
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '13px'
                            }}
                          >驳回</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <StatCard label="用户总数" value={stats.totalUsers} icon="👥" color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
                <StatCard label="衣物总数" value={stats.totalClothes} icon="👕" color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />
                <StatCard label="完成交换" value={stats.totalSwaps} icon="🔄" color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" />
                <StatCard label="待审核" value={stats.pendingClothes} icon="⏳" color="linear-gradient(135deg, #fa709a 0%, #fee140 100%)" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>热门品类排行</h3>
                  {stats.categoryStats.length === 0 ? (
                    <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>暂无数据</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stats.categoryStats.map((cat, index) => (
                        <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: index < 3 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#eee',
                            color: index < 3 ? 'white' : '#999',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>{index + 1}</span>
                          <span style={{ flex: 1, fontSize: '14px' }}>{cat.category}</span>
                          <div style={{
                            width: '120px',
                            height: '8px',
                            background: '#f0f0f0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${(cat.count / stats.categoryStats[0].count) * 100}%`,
                              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: '4px'
                            }} />
                          </div>
                          <span style={{ fontSize: '14px', color: '#666', width: '40px', textAlign: 'right' }}>{cat.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>热门品牌排行</h3>
                  {stats.brandStats.length === 0 ? (
                    <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>暂无数据</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stats.brandStats.slice(0, 10).map((brand, index) => (
                        <div key={brand.brand} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: index < 3 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : '#eee',
                            color: index < 3 ? 'white' : '#999',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>{index + 1}</span>
                          <span style={{ flex: 1, fontSize: '14px' }}>{brand.brand}</span>
                          <span style={{ fontSize: '14px', color: '#666' }}>{brand.count} 件</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                marginTop: '24px'
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>近30天交换量</h3>
                {stats.dailySwaps.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>暂无数据</p>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '4px',
                    height: '200px',
                    padding: '0 10px'
                  }}>
                    {[...stats.dailySwaps].reverse().map((day, index) => {
                      const maxCount = Math.max(...stats.dailySwaps.map(d => d.count))
                      const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                      return (
                        <div key={index} style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px'
                        }} title={`${day.date}: ${day.count}次`}>
                          <span style={{ fontSize: '11px', color: '#999' }}>{day.count}</span>
                          <div style={{
                            width: '100%',
                            height: `${height}%`,
                            minHeight: day.count > 0 ? '4px' : '0',
                            background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '4px 4px 0 0'
                          }} />
                          <span style={{ fontSize: '10px', color: '#ccc' }}>
                            {day.date.slice(5)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedClothes && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedClothes(null)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '24px'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>{selectedClothes.title}</h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '16px'
            }}>
              {selectedClothes.images?.map((img, i) => (
                <img key={i} src={img} alt="" style={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }} />
              ))}
            </div>

            <div style={{ fontSize: '14px', lineHeight: 1.8, color: '#666' }}>
              <p><strong>品牌：</strong>{selectedClothes.brand || '未填写'}</p>
              <p><strong>分类：</strong>{selectedClothes.category}</p>
              <p><strong>尺码：</strong>{selectedClothes.size}</p>
              <p><strong>成色：</strong>{selectedClothes.condition}</p>
              <p><strong>期望交换：</strong>{selectedClothes.wanted_types || '未填写'}</p>
              <p style={{ marginTop: '12px' }}><strong>描述：</strong></p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedClothes.description || '无'}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => { handleReject(selectedClothes.id); setSelectedClothes(null) }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ff4d4f',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >驳回</button>
              <button
                onClick={() => { handleApprove(selectedClothes.id); setSelectedClothes(null) }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#52c41a',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >通过审核</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
