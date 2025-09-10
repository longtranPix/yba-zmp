import React, { useEffect } from "react";
import APIServices from "../services/api-service";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { poweredByBlockState } from "../state";
import { IMAGE_DOMAINS } from "../utils/imageHelper";

const PoweredByBlock = ({ customClass }) => {
  const [data, setData] = useRecoilState(poweredByBlockState);
  const navigate = useNavigate();

  useEffect(() => {
    const getCBBData = async () => {
      console.log('========getCBBData========');
      const result = await APIServices.getCBBInfo();
      console.log(result.data);
      setData(result.data);
    };
    if (!data) {
      getCBBData();
    }
  }, [data, setData]);

  const handleClick = () => {
    if (!data) return;
    // Handle both old and new data structure
    const sponsorId = data?.documentId || data?.id;
    navigate("/sponsors/detail/" + sponsorId);
  };

  return (
    <div className={customClass}>
      <img
        onClick={handleClick}
        className="w-[155px] block m-auto"
        src={"https://yba-zma-strapi.appmkt.vn/uploads/Powered_by_Cubable_1_07e77f0a39.png"}
        alt="Powered by YBA HCM"
      />
    </div>
  );
};

export default PoweredByBlock;
