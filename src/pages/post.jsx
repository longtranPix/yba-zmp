import React, { useState, useEffect } from "react"
import { Icon, Page, useNavigate } from "zmp-ui"
import { useRecoilValue } from "recoil"
import Helper from "../utils/helper"
import { listPostsState } from "../state"
import { getImageProps } from "../utils/imageHelper"
import APIService from "../services/api-service"

const PostPage = () => {
  const navigate = useNavigate()
  const posts = useRecoilValue(listPostsState)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all") // Changed to string for better category handling
  const [visiblePosts, setVisiblePosts] = useState(4)
  const [filteredPostsData, setFilteredPostsData] = useState([])
  const [isLoadingCategory, setIsLoadingCategory] = useState(false)

  // ===== FIXED: Define available post categories =====
  const postCategories = [
    { value: "all", label: "Tất cả", description: "Tất cả tin tức" },
    { value: "Tin hội viên", label: "Tin hội viên", description: "Tin tức dành cho hội viên" },
    { value: "Tin hoạt động hội", label: "Tin hoạt động hội", description: "Tin tức về các hoạt động của hội" },
    { value: "Đào tạo pháp lý", label: "Đào tạo pháp lý", description: "Tin tức về đào tạo và pháp lý" },
    { value: "Tin kinh tế", label: "Tin kinh tế", description: "Tin tức kinh tế và thị trường" }
  ]

  // ===== FIXED: Add useEffect to handle category filtering =====
  useEffect(() => {
    const loadPostsByCategory = async () => {
      if (activeCategory === "all") {
        // Use all posts from Recoil state
        setFilteredPostsData(posts?.posts || [])
        return
      }

      console.log('PostPage: Loading posts by category:', activeCategory)
      setIsLoadingCategory(true)

      try {
        const result = await APIService.getPostsByCategory(activeCategory, 0, 50) // Load more posts for category

        if (result.error === 0 && result.data) {
          console.log('PostPage: Category posts loaded:', {
            category: activeCategory,
            count: result.data.length
          })
          setFilteredPostsData(result.data)
        } else {
          console.error('PostPage: Error loading category posts:', result.message)
          setFilteredPostsData([])
        }
      } catch (error) {
        console.error('PostPage: Error loading category posts:', error)
        setFilteredPostsData([])
      } finally {
        setIsLoadingCategory(false)
      }
    }

    loadPostsByCategory()
  }, [activeCategory, posts])

  const handleSearch = (value) => {
    setSearchTerm(value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch(searchTerm)
  }

  const handleCategoryChange = (categoryValue) => {
    console.log('PostPage: Category changed to:', categoryValue)
    setActiveCategory(categoryValue)
    setVisiblePosts(4) // Reset visible posts when category changes
  }

  const normalizeVietnameseText = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }

  // ===== FIXED: Use filtered posts data with search functionality =====
  const filteredPosts = filteredPostsData
    ?.filter((post) => {
      const normalizedSearch = normalizeVietnameseText(searchTerm)
      // GraphQL field names: tieu_de, noi_dung
      const title = post.tieu_de || ""
      const content = post.noi_dung || ""

      const matchesSearch = !searchTerm ||
        normalizeVietnameseText(title).includes(normalizedSearch) ||
        normalizeVietnameseText(content).includes(normalizedSearch)

      return matchesSearch
    })
      .sort((a, b) => {
        // GraphQL field names: ngay_dang, createdAt
        const dateA = new Date(a.ngay_dang || a.createdAt)
        const dateB = new Date(b.ngay_dang || b.createdAt)
        return dateB - dateA
      }) || []

  const displayedPosts = filteredPosts.slice(0, visiblePosts)
  const hasMorePosts = filteredPosts.length > visiblePosts

  const loadMore = () => {
    setVisiblePosts((prev) => prev + 4)
  }

  return (
    <Page
      className="bg-white page safe-page-content"
      restoreScrollOnBack={true}
    >
      <div className="text-base">
        <form
          onSubmit={handleSubmit}
          className="relative w-full pb-2"
        >
          <div className="flex items-center bg-gray-100 rounded-full py-1.5 px-2 h-8">
            <Icon
              icon="zi-search"
              size={20}
              className="text-[#BBBBBB]"
            />
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="w-full bg-transparent outline-none border-none pl-1.5 text-gray-500"
              onChange={(e) => handleSearch(e.target.value)}
              value={searchTerm}
            />
          </div>
        </form>
        {/* ===== FIXED: Updated category tabs to use postCategories ===== */}
        <div className="py-3 pl-4 overflow-x-auto no-scrollbar">
          <div className="flex space-x-2 min-w-max">
            {postCategories.map((category) => (
              <div
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                className={`justify-center text-center flex items-center py-2 px-3 text-sm font-medium rounded-full border cursor-pointer ${
                  activeCategory === category.value
                    ? "text-[#F40000] border-[#F40000] bg-white"
                    : "text-[#999999] border-[#E5E5E5] bg-[#F4F4F4]"
                }`}
              >
                {category.label}
                </div>
              ))}
          </div>
        </div>
        {displayedPosts && displayedPosts.length > 0 ? (
          displayedPosts.map((post, i) => (
            <div
              className="mb-4 overflow-hidden border rounded-lg cursor-pointer"
              key={i}
              onClick={() => navigate(`/posts/detail/${post.documentId}`)}
            >
              <img
                className="block object-cover w-full h-48"
                {...getImageProps(post.hinh_anh_minh_hoa?.url)}
                alt="Post Thumbnail"
              />
              <div className="grid gap-2 mx-4 my-3">
                <p className="text-sm font-normal text-[#F40000]">
                  Thông tin - Sự kiện
                  {/* Category information will be added when category relationship is implemented */}
                </p>
                <p className="line-clamp-3 text-base font-semibold text-[#333333]">
                  {post.tieu_de}
                </p>
                <p
                  dangerouslySetInnerHTML={{
                    __html: post.noi_dung || "",
                  }}
                  className="line-clamp-3 text-sm text-[#999999] max-h-[60px]"
                ></p>
              </div>
              <div className="flex justify-between items-center text-sm text-[#999999] py-3 px-4 border-t border-[#e5e5e5]">
                <div className="flex items-center">
                  <Icon
                    icon="zi-clock-1"
                    size={16}
                    className="mr-1"
                  />
                  <span>
                    {Helper.formatDate(post.ngay_dang || post.createdAt)}
                  </span>
                </div>
                <div className="flex items-center uppercase">
                  <Icon
                    icon="zi-user-solid"
                    size={16}
                    className="mr-1"
                  />
                  <span>{post.tac_gia || post.hoi_vien?.full_name}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="mx-auto mt-32 text-center">
            <img
              className="block w-24 h-auto m-auto"
              src="https://api.ybahcm.vn/public/yba/icon-empty.png"
              alt="No Posts"
            />
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm ? "Không tìm thấy tin tức" : "Chưa có tin tức"}
            </p>
          </div>
        )}
        {posts?.posts && hasMorePosts && (
          <div className="pb-10 mt-5">
            <button
              onClick={loadMore}
              className="block h-10 px-6 mx-auto font-bold text-white rounded-lg bg-blue-custom text-normal"
            >
              Xem thêm
            </button>
          </div>
        )}
      </div>
    </Page>
  )
}

export default PostPage
