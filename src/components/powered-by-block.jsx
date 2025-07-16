import React, { useEffect } from "react";
import APIServices from "../services/api-service";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { poweredByBlockState } from "../state";

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
    navigate("/sponsors/detail/" + data?.id);
  };

  return (
    <div className={customClass}>
      <img
        onClick={handleClick}
        className="w-[155px] block m-auto"
        src="https://api.ybahcm.vn/public/yba/powered_by_logo_v2.png"
      />
    </div>
  );
};

export default PoweredByBlock;
