import React from "react"
import { Box, Page } from "zmp-ui"

const MemberVerifyLoading = () => {
  return (
    <Page className="page bg-white safe-page-content">
      <div className="animate-pulse">
        <Box className="h-24 bg-gray-200 rounded-lg mb-4" />

        <div className="mt-4">
          <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-12 bg-gray-200 rounded-md mb-1" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>

        <div className="mt-4">
          <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-12 bg-gray-200 rounded-md mb-1" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <div className="h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </Page>
  )
}

export default MemberVerifyLoading
