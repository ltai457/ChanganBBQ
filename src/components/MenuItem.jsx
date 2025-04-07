import React, { useEffect } from "react";

// Define font styles outside the component
const styles = {
  preahvihearFont: {
    fontFamily: "'Preahvihear', sans-serif"
  },
  winkySansFont: {
    fontFamily: "'Winky Sans', sans-serif",
    fontOpticalSizing: "auto",
    fontWeight: 400,
    fontStyle: "normal"
  }
};

const MenuItem = ({ item }) => {
  // Add this useEffect to load the Winky Sans font
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    // You may need to replace this URL with the actual source for Winky Sans
    link.href = 'https://fonts.googleapis.com/css2?family=Winky+Sans&display=swap';
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const displayPrice = () => {
    // Format number with commas
    const formatNumber = (num) => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
  
    let price = (
      <>
        <span style={{ fontSize: '1.2em' }}>៛</span> {formatNumber(item.price || "0.00")}
      </>
    );
    
    if (item.priceUsd) {
      price = (
        <>
          {price} / <span style={{ fontSize: '1.1em' }}>$</span>{formatNumber(item.priceUsd?.toFixed(2))}
        </>
      );
    }
    
    return price;
  };
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      <div className="h-40 w-full overflow-hidden">
        <img
          src={
            item.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"
          }
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://via.placeholder.com/300x200?text=Image+Not+Found";
          }}
        />
      </div>
      <div className="p-3 flex-grow flex flex-col justify-between">
        <div className="mb-2">
          <h3 className="text-m font-extrabold text-gray-900" style={styles.preahvihearFont}>
            {item.name}
          </h3>
          {item.nameEn && (
            <div className="text-m font-bold text-gray-800" style={styles.winkySansFont}>
              {item.nameEn}
            </div>
          )}
          {item.nameCn && (
            <div className="text-m font-bold text-gray-800" style={styles.preahvihearFont}>
              {item.nameCn}
            </div>
          )}
        </div>

        {item.description && (
          <div className="mb-2">
            <p className="text-gray-600 text-xs line-clamp-2" style={styles.preahvihearFont}>
              {item.description}
            </p>
            {item.descriptionEn && (
              <p className="text-gray-500 text-xs line-clamp-1" style={styles.winkySansFont}>
                {item.descriptionEn}
              </p>
            )}
            {item.descriptionCn && (
              <p className="text-gray-500 text-xs line-clamp-1" style={styles.preahvihearFont}>
                {item.descriptionCn}
              </p>
            )}
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-red-600 font-bold text-sm" >
            {displayPrice()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MenuItem;