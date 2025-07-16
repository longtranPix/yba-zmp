import React, { useState } from "react"
import { Icon, Page, useNavigate } from "zmp-ui"
import { useRecoilValue } from "recoil"
import Helper from "../utils/helper"
import { listCategoriesState, listPostsState } from "../state"

const PostPage = () => {
  const navigate = useNavigate()
  const posts = useRecoilValue(listPostsState)
  const categories = useRecoilValue(listCategoriesState)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState(1)
  const [visiblePosts, setVisiblePosts] = useState(4)

  const handleSearch = (value) => {
    setSearchTerm(value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch(searchTerm)
  }

  const normalizeVietnameseText = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }

  const filteredPosts =
    posts?.posts
      ?.filter((post) => {
        const normalizedSearch = normalizeVietnameseText(searchTerm)
        // GraphQL field names: tieu_de, noi_dung
        const title = post.tieu_de || ""
        const content = post.noi_dung || ""

        const matchesSearch =
          normalizeVietnameseText(title).includes(normalizedSearch) ||
          normalizeVietnameseText(content).includes(normalizedSearch)

        // For now, show all posts since category filtering needs to be implemented
        const matchesCategory = activeCategory === 1

        return matchesSearch && matchesCategory
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
        <div className="py-3 pl-4 overflow-x-auto no-scrollbar">
          <div className="flex space-x-2 min-w-max">
            {categories &&
              categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === category.id ? 1 : category.id
                    )
                  }
                  className={` justify-center text-center flex items-center py-2 px-3 text-sm font-medium rounded-full border border-2 ${
                    activeCategory === category.id
                      ? "text-[#F40000] border-[#F40000] bg-white"
                      : "text-[#999999] border-[#E5E5E5] bg-[#F4F4F4]"
                  }`}
                >
                  {category.name}
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
                src={
                  post.hinh_anh_minh_hoa?.url ||
                  "https://api.ybahcm.vn/public/yba/yba-01.png"
                }
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
