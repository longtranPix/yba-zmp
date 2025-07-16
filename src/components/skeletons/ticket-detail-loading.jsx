import React from "react"
import { Page, Icon } from "zmp-ui"

const TicketDetailLoading = () => {
  return (
    <Page className="page bg-white safe-page-content">
      <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>

      <div className="py-4">
        <div className="h-6 bg-gray-200 rounded-full w-3/4 mb-4 animate-pulse"></div>

        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded-full w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-full w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-full w-4/6 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-3 gap-4 px-2 py-4 border rounded-lg my-4">
          {[...Array(6)].map((_, index) => (
            <React.Fragment key={index}>
              <div className="h-4 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-full col-span-2 animate-pulse"></div>
            </React.Fragment>
          ))}
        </div>

        <div className="my-4">
          <div className="h-5 bg-gray-200 rounded-full w-48 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-3 gap-4 px-2 py-4 border rounded-lg">
            {[...Array(8)].map((_, index) => (
              <React.Fragment key={index}>
                <div className="h-4 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-full col-span-2 animate-pulse"></div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex p-3 items-center border justify-between rounded-lg my-4 animate-pulse">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-40 bg-gray-200 rounded-full ml-4"></div>
          </div>
          <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between">
        <div className="w-1/6 mr-2">
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="w-5/6 ml-2">
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </Page>
  )
}

export default TicketDetailLoading
