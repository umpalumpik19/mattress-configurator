import React, { useState, useEffect, useRef } from 'react';
import './FloatingMattress.css';

const FloatingMattress = ({
  selectedSize,
  selectedHeight,
  selectedOptions,
  getSelectedItemData,
  visibleKeys,
  sizeKind,
  totalPrice,
  layerTitles
}) => {
  const [animationKey, setAnimationKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const prevOptionsRef = useRef(selectedOptions);

  useEffect(() => {
    const layerKeys = ['sloj-odin', 'sloj-dva', 'sloj-tri'];
    
    const hasLayerChanged = layerKeys.some(key => 
      selectedOptions[key] !== prevOptionsRef.current[key]
    );

    if (hasLayerChanged) {
      setAnimationKey(prev => prev + 1);
    }
    
    prevOptionsRef.current = { ...selectedOptions };
  }, [selectedOptions]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || 
                      window.pageYOffset || 
                      document.documentElement.scrollTop || 
                      document.body.scrollTop || 0;
      
      const threshold = 150;
      const newIsExpanded = scrollY < threshold;
      
      if (newIsExpanded !== isExpanded) {
        setIsExpanded(newIsExpanded);
      }
    };

    const targets = [window, document, document.body, document.documentElement];
    targets.forEach(target => {
      if (target) {
        target.addEventListener('scroll', handleScroll, { passive: true });
      }
    });
    
    handleScroll();
    
    return () => {
      targets.forEach(target => {
        if (target) {
          target.removeEventListener('scroll', handleScroll);
        }
      });
    };
  }, [isExpanded]);

  const renderLayers = () => {
    const layers = [];
    const kind = sizeKind(selectedSize);
    
    const frameUrl = `/layers/${selectedHeight}/${kind}/frame.webp`;
    
    visibleKeys.forEach((key) => {
      const selectedItem = getSelectedItemData(key, selectedOptions[key]);
      if (!selectedItem || !selectedItem.slug) return;
      
      const layerUrl = `/layers/${selectedHeight}/${kind}/${key}/${selectedItem.slug}.webp`;
      
      const zIndexMap = {
        'sloj-odin': 1,
        'sloj-dva': 10,
        'sloj-tri': 2
      };
      
      layers.push(
        <img
          key={key}
          src={layerUrl}
          alt={selectedItem.name || ''}
          className="floating-mattress-layer"
          style={{ zIndex: zIndexMap[key] || 0 }}
          onError={(e) => e.target.style.display = 'none'}
        />
      );
    });
    
    layers.push(
      <img
        key="frame"
        src={frameUrl}
        alt="Frame"
        className="floating-mattress-layer"
        style={{ zIndex: 100 }}
        onError={(e) => e.target.style.display = 'none'}
      />
    );
    
    return layers;
  };

  return (
    <div className={`floating-mattress ${isExpanded ? 'expanded' : 'compact'}`}>
      <div className="floating-mattress-container" key={animationKey}>
        <div className="floating-mattress-image-wrapper">
          <img
            src={`/layers/${selectedHeight}/${sizeKind(selectedSize)}/frame.webp`}
            alt="Frame"
            style={{ width: '100%', height: 'auto', display: 'block', visibility: 'hidden' }}
          />
          {renderLayers()}
        </div>
        <div className="floating-mattress-info">
          <div className="floating-mattress-layers">
            {visibleKeys.map((key) => {
              const item = getSelectedItemData(key, selectedOptions[key]);
              return item?.name ? (
                <div key={key} className="layer-row">
                  <span className="layer-name">{item.name}</span>
                </div>
              ) : null;
            })}
          </div>
          <div className="floating-mattress-price">
            <span className="price-value">
              {totalPrice.toLocaleString('ru-RU')}
            </span>
            <span className="price-currency">Kč</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingMattress;