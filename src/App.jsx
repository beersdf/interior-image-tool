import { useEffect, useMemo, useRef, useState } from 'react'
import { toJpeg, toPng } from 'html-to-image'

export default function InteriorImageGeneratorApp() {
    useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap'
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  const [mode, setMode] = useState('long')
  const [type, setType] = useState('residential')
  const [coverWidth, setCoverWidth] = useState(850)
  const [commercialTitle, setCommercialTitle] = useState('카페')
  const [titleEnabled, setTitleEnabled] = useState(true)
  const [imageGap, setImageGap] = useState(10)
  const [selectedRoom, setSelectedRoom] = useState('living')
  const [isExporting, setIsExporting] = useState(false)

  const residentialRooms = [
    { id: 'entrance', label: '현관' },
    { id: 'living', label: '거실' },
    { id: 'kitchen', label: '주방' },
    { id: 'bathroom', label: '화장실' },
    { id: 'bedroom', label: '침실,방' },
  ]

  const [roomImages, setRoomImages] = useState({
    entrance: [],
    living: [],
    kitchen: [],
    bathroom: [],
    bedroom: [],
  })

  const [imageSettings, setImageSettings] = useState([])

  const previewRef = useRef(null)

  const currentImages = useMemo(() => {
    if (mode === 'cover') return roomImages.living || []

    if (type === 'commercial') {
      return roomImages.living || []
    }

    return roomImages[selectedRoom] || []
  }, [mode, type, roomImages, selectedRoom])

  const ensureImageSettings = (count) => {
    setImageSettings((prev) => {
      const next = [...prev]

      while (next.length < count) {
        next.push({
          watermarkType: 'white',
          watermarkPosition: 'bottom-right',
          watermarkSize: 84,
          cropTop: 120,
          cropBottom: 80,
        })
      }

      return next
    })
  }

  const convertFiles = async (fileList) => {
    return Promise.all(
      Array.from(fileList || []).map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader()

              reader.onload = () => {
              const img = new Image()

              img.onload = () => {
                resolve({
                  file,
                  preview: reader.result,
                  name: file.name,
                  width: img.width,
                  height: img.height,
                })
              }

              img.src = reader.result
            }

            reader.readAsDataURL(file)
          })
      )
    )
  }

  const handleUpload = async (event, roomId = null) => {
    const files = await convertFiles(event.target.files)

    if (!files.length) return

    ensureImageSettings(files.length + imageSettings.length)

    if (mode === 'cover') {
      setRoomImages((prev) => ({
        ...prev,
        living: [...prev.living, ...files],
      }))
      return
    }

    if (type === 'commercial') {
      setRoomImages((prev) => ({
        ...prev,
        living: [...prev.living, ...files],
      }))
      return
    }

    if (roomId) {
      setRoomImages((prev) => ({
        ...prev,
        [roomId]: [...prev[roomId], ...files],
      }))
    }
  }

  const updateImageSetting = (index, key, value) => {
    setImageSettings((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item

        return {
          ...item,
          [key]: value,
        }
      })
    )
  }

  const removeImage = (index) => {
    const targetKey =
      mode === 'cover'
        ? 'living'
        : type === 'commercial'
          ? 'living'
          : selectedRoom

    setRoomImages((prev) => ({
      ...prev,
      [targetKey]: prev[targetKey].filter((_, idx) => idx !== index),
    }))
  }

  const getImageUrl = (file) => {
    return file?.preview || ''
  }

  const getWatermarkPositionClass = (position) => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  const downloadDataUrl = (dataUrl, fileName) => {
    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    link.click()
  }

  const exportPNG = async () => {
    try {
      setIsExporting(true)
      if (!previewRef.current) return

      const exportWidth = mode === 'long' ? 850 : coverWidth

      const dataUrl = await toPng(previewRef.current, {
        canvasWidth: exportWidth,
        width: exportWidth,
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: '#FFFDF7',
        style: {
          borderRadius: '0px',
          margin: '0',
          padding: '0',
          display: 'block',
        },
      })

      downloadDataUrl(dataUrl, 'export.png')
      setIsExporting(false)
    } catch (error) {
      console.error(error)
      alert('PNG export 실패')
      setIsExporting(false)
    }
  }

  const exportJPG = async () => {
    try {
      setIsExporting(true)
      if (!previewRef.current) return

      const exportWidth = mode === 'long' ? 850 : coverWidth

      const dataUrl = await toJpeg(previewRef.current, {
        canvasWidth: exportWidth,
        width: exportWidth,
        cacheBust: true,
        pixelRatio: 1,
        quality: 0.95,
        backgroundColor: '#FFFDF7',
        style: {
          borderRadius: '0px',
          margin: '0',
          padding: '0',
          display: 'block',
        },
      })

      downloadDataUrl(dataUrl, 'export.jpg')
      setIsExporting(false)
    } catch (error) {
      console.error(error)
      alert('JPG export 실패')
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f4ee] text-zinc-900 p-8">
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 xl:grid-cols-[320px_520px_1fr] gap-6 items-start">
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 space-y-6 sticky top-6">
          <div>
            <h1 className="text-2xl font-bold">Interior Image Tool</h1>
            <p className="text-sm text-zinc-500 mt-1">공간 이미지 제작 툴</p>
          </div>

          {mode === 'long' && (
            <div className="space-y-3">
              <div className="text-sm font-semibold">타입 선택</div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setType('residential')}
                  className={`rounded-2xl py-3 text-sm font-medium ${
                    type === 'residential'
                      ? 'bg-black text-white'
                      : 'border border-zinc-300 bg-white'
                  }`}
                >
                  주거
                </button>

                <button
                  onClick={() => setType('commercial')}
                  className={`rounded-2xl py-3 text-sm font-medium ${
                    type === 'commercial'
                      ? 'bg-black text-white'
                      : 'border border-zinc-300 bg-white'
                  }`}
                >
                  상업
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm font-semibold">이미지 간격</div>

            <input
              type="number"
              value={imageGap}
              onChange={(e) => setImageGap(Number(e.target.value))}
              className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none"
            />
          </div>

          {mode === 'long' && type === 'commercial' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">상업용 타이틀</div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setTitleEnabled(true)}
                    className={`rounded-full px-4 py-2 text-xs ${
                      titleEnabled
                        ? 'bg-black text-white'
                        : 'border border-zinc-300 bg-white'
                    }`}
                  >
                    사용
                  </button>

                  <button
                    onClick={() => setTitleEnabled(false)}
                    className={`rounded-full px-4 py-2 text-xs ${
                      !titleEnabled
                        ? 'bg-black text-white'
                        : 'border border-zinc-300 bg-white'
                    }`}
                  >
                    미사용
                  </button>
                </div>
              </div>

              <input
                value={commercialTitle}
                onChange={(e) => setCommercialTitle(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm font-semibold">Export</div>

            <button
              onClick={exportPNG}
              className="w-full rounded-2xl bg-black text-white py-4 font-semibold"
            >
              PNG 저장
            </button>

            <button
              onClick={exportJPG}
              className="w-full rounded-2xl border border-zinc-300 bg-white py-4 font-semibold"
            >
              JPG 저장
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {type === 'commercial' && (
            <div className="bg-white rounded-3xl border border-dashed border-zinc-300 p-10 text-center shadow-sm">
              <div className="text-lg font-semibold">상업 이미지 업로드</div>

              <div className="mt-6">
                <input type="file" multiple onChange={handleUpload} />
              </div>
            </div>
          )}

          {type === 'residential' && (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
              <div className="text-lg font-bold mb-4">주거 묶음 생성</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {residentialRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`rounded-3xl border p-5 ${
                      selectedRoom === room.id
                        ? 'border-black bg-black text-white'
                        : 'border-zinc-200 bg-zinc-50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedRoom(room.id)}
                      className="w-full text-left"
                    >
                      <div className="font-semibold text-lg">{room.label}</div>

                      <div className="text-sm opacity-70 mt-1 mb-4">
                        배정 이미지 {roomImages[room.id]?.length || 0}장
                      </div>
                    </button>

                    <label className="flex items-center justify-center rounded-2xl border border-dashed py-4 text-sm font-medium cursor-pointer">
                      이미지 업로드

                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleUpload(e, room.id)}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentImages.length > 0 && (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-bold">이미지 상세 설정</div>
                <div className="text-sm text-zinc-500">
                  총 {currentImages.length}장
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {currentImages.map((file, index) => {
                  const image = imageSettings[index]

                  if (!image) return null

                  return (
                    <div
                      key={`setting-${index}`}
                      className="rounded-3xl border border-zinc-200 overflow-hidden bg-white relative"
                    >
                      <div className="absolute top-4 right-4 z-20">
                        <button
                          onClick={() => removeImage(index)}
                          className="w-9 h-9 rounded-full bg-black text-white"
                        >
                          ×
                        </button>
                      </div>

                      <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden">
                        <img
                          src={getImageUrl(file)}
                          alt="preview"
                          className="w-full object-cover"
                          style={{
                            height: `calc(100% + ${image.cropTop + image.cropBottom}px)`,
                            marginTop: `-${image.cropTop}px`,
                          }}
                        />
                      </div>

                      <div className="p-5 space-y-5">
                        {mode === 'long' && (
                          <>
                            <div>
                              <div className="text-sm font-semibold mb-3">
                                워터마크 색상
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() =>
                                    updateImageSetting(index, 'watermarkType', 'white')
                                  }
                                  className={`rounded-2xl py-3 border ${
                                    image.watermarkType === 'white'
                                      ? 'bg-black text-white border-black'
                                      : 'border-zinc-300 bg-white'
                                  }`}
                                >
                                  White
                                </button>

                                <button
                                  onClick={() =>
                                    updateImageSetting(index, 'watermarkType', 'black')
                                  }
                                  className={`rounded-2xl py-3 border ${
                                    image.watermarkType === 'black'
                                      ? 'bg-black text-white border-black'
                                      : 'border-zinc-300 bg-white'
                                  }`}
                                >
                                  Black
                                </button>
                              </div>
                            </div>

                            <div>
                              <div className="text-sm font-semibold mb-3">
                                워터마크 위치
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                                  <button
                                    key={pos}
                                    onClick={() =>
                                      updateImageSetting(index, 'watermarkPosition', pos)
                                    }
                                    className={`rounded-2xl py-3 border text-xs ${
                                      image.watermarkPosition === pos
                                        ? 'bg-black text-white border-black'
                                        : 'border-zinc-300 bg-white'
                                    }`}
                                  >
                                    {pos}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="text-sm font-semibold mb-2">
                                워터마크 크기
                              </div>

                              <input
                                type="number"
                                value={image.watermarkSize}
                                onChange={(e) =>
                                  updateImageSetting(
                                    index,
                                    'watermarkSize',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <div className="text-sm font-semibold mb-2">
                            상단 크롭
                          </div>

                          <input
                            type="number"
                            value={image.cropTop}
                            onChange={(e) =>
                              updateImageSetting(
                                index,
                                'cropTop',
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none"
                          />
                        </div>

                        <div>
                          <div className="text-sm font-semibold mb-2">
                            하단 크롭
                          </div>

                          <input
                            type="number"
                            value={image.cropBottom}
                            onChange={(e) =>
                              updateImageSetting(
                                index,
                                'cropBottom',
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sticky top-6 self-start">
          <div className="text-lg font-bold mb-6">실시간 미리보기</div>

          <div
            ref={previewRef}
            className="bg-[#FFFDF7] overflow-hidden block"
            style={{
              width: mode === 'long' ? 850 : coverWidth,
              maxWidth: mode === 'long' ? 850 : coverWidth,
              borderRadius: 0,
            }}
          >
            {mode === 'long' && titleEnabled && (
              <div className="relative border-b border-zinc-200 bg-[#FFFDF7] h-[160px]">
                <div
                  className="absolute bottom-4.5 right-7 text-4xl font-medium"
                  style={{
                    fontFamily: 'Noto Sans KR, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  {type === 'commercial'
                    ? commercialTitle
                    : residentialRooms.find((r) => r.id === selectedRoom)?.label}
                </div>
              </div>
            )}

            {currentImages.map((file, index) => {
              const image = imageSettings[index]

              if (!image) return null

              return (
                <div
                  key={index}
                  className="relative"
                  style={{
                    marginBottom:
                      index !== currentImages.length - 1 ? imageGap : 0,
                  }}
                >
                  <div
                    className="overflow-hidden relative bg-zinc-100"
                    style={{
                      height: `${file.height - image.cropTop - image.cropBottom}px`,
                    }}
                  >
                    <img
                      src={getImageUrl(file)}
                      alt="preview"
                      className="w-full block"
                      style={{
                        transform: `translateY(-${image.cropTop}px)`,
                      }}
                    />

                    <div
                      className={`absolute overflow-hidden ${getWatermarkPositionClass(
                        image.watermarkPosition
                      )}`}
                      style={{
                        width: image.watermarkSize,
                        height: image.watermarkSize * 0.35,
                      }}
                    >
                      <img
                        src={
                          image.watermarkType === 'white'
                            ? 'https://i.ibb.co/Pv5sFv6F/image.png'
                            : 'https://i.ibb.co/35PbNfmk/1.png'
                        }
                        alt="watermark"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    
    {isExporting && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
          <div className="bg-white px-8 py-6 rounded-3xl shadow-2xl text-center">
            <div className="text-xl font-semibold mb-2">
              이미지 추출 중...
            </div>

            <div className="text-sm text-zinc-500">
              잠시만 기다려주세요
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
