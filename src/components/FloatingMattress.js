// /src/components/FloatingMattress.js
import React, { useState, useEffect, useRef } from 'react';
import './FloatingMattress.css';

const FloatingMattress = ({
  selectedSize,
  selectedHeight,
  selectedOptions,
  getSelectedItemData,
  visibleKeys,
  sizeKind
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mainMattressInView, setMainMattressInView] = useState(true);
  const [isHidingFast, setIsHidingFast] = useState(false);
  const prevOptionsRef = useRef(selectedOptions);
  const hideTimerRef = useRef(null);
  const observerRef = useRef(null);

  // Инициализация с задержкой 1 секунда
  useEffect(() => {
    const initTimer = setTimeout(() => {
      setIsInitialized(true);
    }, 1000);

    return () => clearTimeout(initTimer);
  }, []);

  // Intersection Observer для отслеживания видимости основного матраса
  useEffect(() => {
    const targetElement = document.querySelector('.visual .layers-canvas');
    
    if (!targetElement) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const wasInView = mainMattressInView;
          const nowInView = entry.isIntersecting;
          
          setMainMattressInView(nowInView);
          
          // Если матрас вернулся в зону видимости и анимация была показана
          if (!wasInView && nowInView && isVisible) {
            // Очищаем таймер автоматического исчезновения
            if (hideTimerRef.current) {
              clearTimeout(hideTimerRef.current);
              hideTimerRef.current = null;
            }
            
            // Включаем быстрое исчезновение
            setIsHidingFast(true);
            
            // Скрываем через 200мс (быстрая анимация)
            setTimeout(() => {
              setIsVisible(false);
              setIsHidingFast(false);
            }, 200);
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    observerRef.current.observe(targetElement);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [mainMattressInView, isVisible]);

  // Отслеживание изменений слоев
  useEffect(() => {
    if (!isInitialized) return;

    // Проверяем, изменились ли слои
    const hasLayerChanged = visibleKeys.some(key => 
      prevOptionsRef.current[key] !== selectedOptions[key]
    );

    // Показываем анимацию только если:
    // 1. Основной матрас не виден
    // 2. Произошло изменение слоя
    if (!mainMattressInView && hasLayerChanged) {
      // Очищаем предыдущий таймер, если он есть
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      // Перезапускаем анимацию с новым ключом
      setAnimationKey(prev => prev + 1);
      setIsVisible(true);

      // Скрываем через 3 секунды
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        hideTimerRef.current = null;
      }, 3000);
    }

    // Обновляем референс с предыдущими опциями
    prevOptionsRef.current = { ...selectedOptions };

  }, [selectedOptions, visibleKeys, isInitialized, mainMattressInView]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`floating-mattress ${isHidingFast ? 'hiding-fast' : ''}`} key={animationKey}>
      <div className="floating-mattress-container">
        <div className="floating-mattress-canvas">
          {/* Каркас матраса */}
          <img
            src={`/layers/${selectedHeight}/${sizeKind(selectedSize)}/frame.webp`}
            alt="Каркас матраса"
            className="floating-layer layer-frame"
            style={{ zIndex: 100 }}
          />
          
          {/* Слои матраса */}
          {visibleKeys.map((layerKey) => {
            const selectedItem = getSelectedItemData(layerKey, selectedOptions[layerKey]);
            if (!selectedItem) return null;
            
            const zIndexMap = { 
              'sloj-odin': 1, 
              'sloj-dva': 10, 
              'sloj-tri': 2 
            };
            
            return (
              <img
                key={layerKey}
                src={`/layers/${selectedHeight}/${sizeKind(selectedSize)}/${layerKey}/${selectedItem.slug}.webp`}
                alt={selectedItem.name}
                className="floating-layer"
                style={{ zIndex: zIndexMap[layerKey] }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FloatingMattress;