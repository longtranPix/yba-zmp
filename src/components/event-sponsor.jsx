import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSponsorLogoUrl, getImageProps } from "../utils/imageHelper";
import Helper from "../utils/helper";

const EventSponsors = ({ sponsors }) => {
  const [data, setData] = useState(null);
  const [levels, setLevels] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sponsors || sponsors.length == 0) {
      setData(null);
      return;
    }
    let newData = {};
    for (let item of sponsors) {
      let sponsorshipTier = item.hang || "Other";
      let list = newData[sponsorshipTier] ? newData[sponsorshipTier] : [];
      list.push({
        ...item,
        sponsorshipTier,
        logoUrls: item.logo?.url ? [getSponsorLogoUrl(item)] : [],
      });
      newData[sponsorshipTier] = list;
    }
    setData(newData);
    let keys = Object.keys(newData);
    setLevels(keys);
  }, [sponsors]);

  // ===== FIXED: Use helper function for consistent tier display =====
  const formatTierName = (tier) => {
    return Helper.getSponsorRankDisplay(tier);
  };

  if (sponsors == null || sponsors.length == 0 || !data) {
    return null;
  }
  return (
    <div className="">
      <p className="text-[#0D0D0D] text-normal font-bold py-2">Tài trợ</p>
      <div className="border rounded-md text-sm">
        {levels.map((key, index) => {
          let list = data[key] || [];
          return (
            <div
              className={`flex py-2 px-2 ${
                index < levels.length - 1 ? "border-b" : ""
              }`}
              key={index}
            >
              <p className="w-1/3 h-12 pt-[0.5rem] text-[#6F7071]">
                {formatTierName(key)}
              </p>
              <div className="w-2/3 pl-2">
                <div className="flex flex-wrap gap-4">
                  {list.map((v, i) => {
                    return (
                      <img
                        onClick={() => navigate(`/sponsors/detail/${v.documentId}`)}
                        {...getImageProps(v.logo?.url, "https://placehold.co/125x125")}
                        alt={v.ten_cong_ty || "Sponsor logo"}
                        className="h-10 w-auto"
                        key={i}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventSponsors;
