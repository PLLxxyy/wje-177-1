import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import api from '../utils/api'

const categories = ['全部', '上衣', '裤子', '裙子', '外套', '鞋子', '配饰', '其他']

const Home = () => {
  const [clothes, setClothes] = useState([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('全部')
  const [size, setSize] = useState('')
  const [brand, setBrand] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [wishlistMatches, setWishlistMatches] = useState([])
  const [showMatches, setShowMatches] = useState(true)
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const loadMoreRef = useRef()

  const fetchClothes = async (reset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const params = {
        page: reset ? 1 : page,
        limit: 20
      }
      if (category !== '全部') params.category = category
      if (size) params.size = size
      if (brand) params.brand = brand
      if (keyword) params.keyword = keyword

      const res = await axios.get('/api/clothes', { params })
      if (reset) {
        setClothes(res.data.list)
        setPage(2)
      } else {
        setClothes(prev => [...prev, ...res.data.list])
        setPage(prev => prev + 1)
      }
      setHasMore(res.data.list.length === 20)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const fetchWishlistMatches = async () => {
    if (!user) return
    try {
      const res = await api.get('/api/wishlist/matches')
      setWishlistMatches(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchClothes(true)
  }, [category, size, brand, keyword])

  useEffect(() => {
    if (user) {
      fetchWishlistMatches()
    }
  }, [user])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchClothes()
        }
      },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, clothes])

  const handleSearch = (e) => {
    e.preventDefault()
    setKeyword(searchInput)
  }

  const ClothesCard = ({ item }) => (
    <Link to={`/clothes/${item.id}`} style={{
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'block',
      marginBottom: '16px'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
    }}
    >
      <div style={{
        width: '100%',
        aspectRatio: '3/4',
        overflow: 'hidden',
        background: '#f0f0f0'
      }}>
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
            暂无图片
          </div>
        )}
      </div>
      <div style={{ padding: '12px' }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#333',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>{item.title}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '12px',
            color: '#667eea',
            background: 'rgba(102, 126, 234, 0.1)',
            padding: '2px 8px',
            borderRadius: '10px'
          }}>{item.category}</span>
          <span style={{ fontSize: '12px', color: '#999' }}>{item.condition}</span>
        </div>
        {item.brand && (
          <p style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>品牌：{item.brand}</p>
        )}
      </div>
    </Link>
  )

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 24px 32px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>衣换衣</h1>
        <p style={{ opacity: 0.9, marginBottom: '24px' }}>让闲置衣物焕发新生，以衣会友</p>
        <form onSubmit={handleSearch} style={{
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          gap: '8px'
        }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索衣物、品牌..."
            style={{
              flex: 1,
              padding: '12px 20px',
              border: 'none',
              borderRadius: '25px',
              fontSize: '15px'
            }}
          />
          <button type="submit" style={{
            padding: '0 28px',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '15px',
            fontWeight: 500
          }}>搜索</button>
        </form>
      </div>

      {user && wishlistMatches.length > 0 && showMatches && (
        <div style={{
          maxWidth: '1200px',
          margin: '20px auto',
          padding: '0 24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fff5e6 0%, #ffe0b2 100%)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>✨</span>
              <div>
                <h3 style={{ fontSize: '15px', color: '#e65100', marginBottom: '2px' }}>为你推荐</h3>
                <p style={{ fontSize: '13px', color: '#ff9800' }}>根据你的心愿单，有 {wishlistMatches.length} 件新匹配的衣物</p>
              </div>
            </div>
            <button
              onClick={() => setShowMatches(false)}
              style={{
                background: 'transparent',
                color: '#999',
                fontSize: '20px',
                padding: '4px 8px'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div style={{
        maxWidth: '1200px',
        margin: '24px auto',
        padding: '0 24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#666', fontSize: '14px', marginRight: '8px' }}>分类：</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1) }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  background: category === cat ? '#667eea' : '#f5f5f5',
                  color: category === cat ? 'white' : '#666',
                  border: 'none'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>尺码：</span>
              <select
                value={size}
                onChange={(e) => { setSize(e.target.value); setPage(1) }}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: 'white'
                }}
              >
                <option value="">全部</option>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', '均码', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>品牌：</span>
              <input
                type="text"
                value={brand}
                onChange={(e) => { setBrand(e.target.value); setPage(1) }}
                placeholder="输入品牌"
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '13px',
                  width: '120px'
                }}
              />
            </div>
          </div>
        </div>

        {clothes.length === 0 && !loading ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#999'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👕</div>
            <p>暂无相关衣物</p>
            {!user && (
              <button
                onClick={() => navigate('/login')}
                style={{
                  marginTop: '16px',
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '14px'
                }}
              >
                登录发布闲置
              </button>
            )}
          </div>
        ) : (
          <div style={{
            columnCount: 4,
            columnGap: '16px'
          }}>
            {clothes.map(item => (
              <ClothesCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <div ref={loadMoreRef} style={{ padding: '20px', textAlign: 'center' }}>
          {loading && <p style={{ color: '#999' }}>加载中...</p>}
          {!hasMore && clothes.length > 0 && <p style={{ color: '#ccc' }}>没有更多了</p>}
        </div>
      </div>
    </div>
  )
}

export default Home
