import React from 'react';

const Tags = ({ items, onClick, active }) => {
    const safeText = (content) => {
        if (!content || content.length < 20) return content;
        return content.substring(0, 20) + '...';
    };
    return (
        <div className="flex overflow-x-auto whitespace-nowrap gap-2 my-4 no-scrollbar">
            {items &&
                items.map((v, i) => {
                    return (
                        <span
                            className={`text-sm rounded-2xl p-1 px-4 font-bold border bg-slate-100 text-[#868689] ${
                                active == i ? 'tag-item-active' : ''
                            }`}
                            onClick={() => onClick(i)}
                            key={i}
                        >
                            {safeText(v.name)}
                        </span>
                    );
                })}
        </div>
    );
};

export default Tags;
