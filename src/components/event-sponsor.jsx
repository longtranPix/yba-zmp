import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
        logoUrls: item.logo?.url ? [item.logo.url] : [],
      });
      newData[sponsorshipTier] = list;
    }
    setData(newData);
    let keys = Object.keys(newData);
    setLevels(keys);
  }, [sponsors]);

  const formatTierName = (tier) => {
    return tier === "Đồng hành chiến lược" ? "Đồng hành" : tier;
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
                    let logoUrl =
                      v.logoUrls && v.logoUrls.length > 0
                        ? v.logoUrls[0]
                        : "https://placehold.co/125x125";
                    return (
                      <img
                        onClick={() => navigate(`/sponsors/detail/${v.documentId}`)}
                        src={logoUrl}
                        alt="Background"
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
