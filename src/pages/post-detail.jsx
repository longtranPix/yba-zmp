import React, { useEffect, useState } from "react"
import { Page, Icon, useNavigate } from "zmp-ui"
import { useParams } from "react-router-dom"
import { openShareSheet } from "zmp-sdk/apis"
import Helper from "../utils/helper"
import { postInfoState } from "../state"
import { useRecoilValue } from "recoil"
import IconShareBlog from "../components/icons/share-icon-blog"

const PostDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const post = useRecoilValue(postInfoState(id))

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate("/")
    }
  }

  const shareLink = `posts/detail/${post?.documentId}`

  const sharePost = async () => {
    try {
      const title = Helper.truncateText(post?.tieu_de, 100)
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: title,
          description: `${title}. Hội doanh nhân trẻ TP.HCM (YBA HCM)`,
          thumbnail:
            (post?.customFields["Ảnh minh hoạ"] &&
              post?.customFields["Ảnh minh hoạ"][0]?.url) ||
            "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: shareLink,
        },
      })
    } catch (error) {
      console.log(error)
    }
  }

  if (!post)
    return (
      <Page className="page bg-white safe-page-content">
        <div className="mx-auto text-center mt-10 mb-44">
          <img
            className="w-24 h-auto block m-auto"
            src="https://api.ybahcm.vn/public/yba/icon-empty.png"
          />
          <p className="text-normal text-[#6F7071] my-2 px-16">
            Không tìm thấy bài viết hoặc bài viết đã bị xóa
          </p>
        </div>
      </Page>
    )

  return (
    <Page className="page bg-white safe-page-content">
      <div className="relative -mx-4 -mt-2.5">
        <img
          className="w-screen"
          src={
            post.hinh_anh_minh_hoa?.url ||
            "https://api.ybahcm.vn/public/yba/yba-01.png"
          }
        />
      </div>
      <div className="py-4 grid gap-2.5">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center">
            <Icon
              icon="zi-clock-1"
              size={16}
              className="mr-1"
            />
            <span>{Helper.formatDate(post.ngay_dang || post.createdAt)}</span>
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
        <p className="text-lg font-bold pb-2 text-[#333333]">
          {post.tieu_de}
        </p>
        <div className="text-normal text-gray-700">
          <div className="ql-snow">
            <div
              className={`ql-editor`}
              dangerouslySetInnerHTML={{
                __html: post.noi_dung || "",
              }}
            />
          </div>
        </div>
        <div className="mt-5 pb-10 flex space-x-[10px] text-[15px] leading-[18px]">
          <button
            className="bg-blue-custom w-1/2 text-white font-medium h-10 rounded-lg mx-auto block"
            onClick={goBack}
          >
            Quay lại mục tin tức
          </button>
          <button
            className="bg-[#F4F4F5] flex space-x-2 items-center justify-center w-1/2 text-black font-bold h-10 rounded-lg mx-auto block"
            onClick={sharePost}
          >
            <span>Chia sẻ</span>
            <IconShareBlog />
          </button>
        </div>
      </div>
    </Page>
  )
}

export default PostDetailPage
