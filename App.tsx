import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Settings, Trophy, Search, Plus, ImageOff, LayoutGrid, UtensilsCrossed, Share2, Copy, MessageCircle, X, ExternalLink } from 'lucide-react';
import { Category, MenuItem, CartItem, AppSettings } from './types';
import { INITIAL_MENU_ITEMS, DEFAULT_SETTINGS, STORAGE_KEYS } from './constants';
import AdminPanel from './components/AdminPanel';
import CartModal from './components/CartModal';

// Componente para Lazy Loading de Imagens
const LazyImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Começa a carregar 100px antes de entrar na tela
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-200 relative overflow-hidden">
      {!isLoaded && isVisible && (
        <div className="absolute inset-0 animate-pulse bg-gray-300"></div>
      )}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
};

function App() {
  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MENU);
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Estados para o Modal de Compartilhamento
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [currentShareData, setCurrentShareData] = useState<{title: string, text: string, url: string} | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Persistence for Menu
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
    } catch (error) {
      console.error("Erro ao salvar cardápio", error);
      alert("Atenção: A memória do aplicativo está cheia! Remova itens antigos.");
    }
  }, [menuItems]);

  // Persistence for Settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error("Erro ao salvar configurações", error);
    }
  }, [settings]);

  // Handlers
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  // --- Lógica de Compartilhamento Atualizada ---

  // Obtém a URL correta.
  const getShareUrl = () => {
    if (settings.shareUrl && settings.shareUrl.trim() !== '') {
      return settings.shareUrl;
    }
    return "";
  };

  const openShareModal = (title: string, text: string) => {
    setCurrentShareData({
      title,
      text,
      url: getShareUrl()
    });
    setIsShareModalOpen(true);
    setCopyFeedback(false);
  };

  const handleShareApp = () => {
    const url = getShareUrl();
    const cleanPhone = settings.whatsappNumber.replace(/\D/g, '');
    
    // Se tiver URL, manda o link. Se não, manda um "Cartão Digital" em texto.
    const text = url 
      ? '⚽ *Várzea Alegre Futebol Clube*\nConfira nosso Cardápio Digital Oficial e faça seu pedido online!' 
      : `⚽ *Várzea Alegre Futebol Clube*\n\n🔥 *Confira nosso cardápio completo!*\n🍔 Lanches\n🍺 Bebidas\n🥓 Petiscos\n\n📲 *Faça seu pedido pelo WhatsApp:*\nhttps://wa.me/${cleanPhone}`;

    openShareModal('Várzea Alegre Futebol Clube', text);
  };

  const handleItemShare = (item: MenuItem) => {
    const url = getShareUrl();
    const cleanPhone = settings.whatsappNumber.replace(/\D/g, '');
    const baseText = `😋 *Desejo do dia:*\n\n*${item.name}* - R$ ${item.price.toFixed(2)}\n_${item.description}_`;
    
    // Se não tiver URL, manda direto pro zap do pedido
    const text = url 
      ? `${baseText}\n\nPeça aqui:` 
      : `${baseText}\n\n📲 *Peça agora pelo WhatsApp:*\nhttps://wa.me/${cleanPhone}?text=Olá, quero pedir o ${encodeURIComponent(item.name)}`;

    openShareModal(`VAFC - ${item.name}`, text);
  };

  const executeCopyLink = () => {
    if (!currentShareData) return;
    const fullText = currentShareData.url 
      ? `${currentShareData.text} ${currentShareData.url}`
      : currentShareData.text;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const executeWhatsAppShare = () => {
    if (!currentShareData) return;
    const fullText = currentShareData.url 
      ? `${currentShareData.text} ${currentShareData.url}`
      : currentShareData.text;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const executeNativeShare = async () => {
    if (!currentShareData) return;
    
    if (navigator.share) {
      try {
        const sharePayload: any = {
          title: currentShareData.title,
          text: currentShareData.text,
        };
        if (currentShareData.url) {
          sharePayload.url = currentShareData.url;
        }

        await navigator.share(sharePayload);
      } catch (err) {
        console.log('User cancelled share or failed', err);
      }
    } else {
      alert("Compartilhamento nativo não suportado.");
    }
  };

  // --- Fim Lógica de Compartilhamento ---

  // Filtering
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = isAdminMode ? true : item.isAvailable;
    return matchesCategory && matchesSearch && matchesAvailability;
  });

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Helper to get image for category
  const getCategoryImage = (category: string) => {
    const item = menuItems.find(i => i.category === category && i.imageUrl);
    return item ? item.imageUrl : null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-green-700 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white text-green-700 p-2 rounded-full shadow-inner">
              <Trophy size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold leading-tight truncate max-w-[180px] md:max-w-none">Várzea Alegre FC</h1>
              <p className="text-green-100 text-xs font-light">Cardápio Oficial</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Botão de Compartilhar App */}
             <button 
                onClick={handleShareApp}
                className="p-2 hover:bg-green-600 rounded-full transition-colors text-green-50"
                title="Divulgar Cardápio"
              >
                <Share2 size={24} />
              </button>

            {!isAdminMode && (
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-green-600 rounded-full transition-colors"
              >
                <ShoppingCart size={24} />
                {cartTotalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {cartTotalItems}
                  </span>
                )}
              </button>
            )}
            <button 
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`p-2 rounded-full transition-colors ${isAdminMode ? 'bg-white text-green-700' : 'hover:bg-green-600'}`}
              title="Painel Admin"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        
        {isAdminMode ? (
          <AdminPanel 
            menuItems={menuItems} 
            setMenuItems={setMenuItems} 
            settings={settings}
            setSettings={setSettings}
            onClose={() => setIsAdminMode(false)}
          />
        ) : (
          <>
            {/* Banner de Boas Vindas */}
            <div className="bg-gradient-to-r from-green-800 to-green-600 rounded-2xl p-6 text-white mb-8 shadow-lg text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
                 <Trophy size={120} />
               </div>
               <h2 className="text-2xl font-bold mb-2 relative z-10">Bem-vindo ao Várzea Alegre FC!</h2>
               <p className="text-green-100 relative z-10">Escolha seus favoritos e peça agora mesmo.</p>
               <button 
                  onClick={handleShareApp}
                  className="mt-4 px-4 py-2 bg-white text-green-800 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors inline-flex items-center gap-2 shadow-md relative z-10"
               >
                 <Share2 size={16} />
                 Compartilhar com Amigos
               </button>
            </div>

            {/* Search and Filter */}
            <div className="mb-8 space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text"
                  placeholder="O que você deseja comer hoje?"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-green-500 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-hide px-1">
                {/* Todos Button */}
                <button 
                  onClick={() => setSelectedCategory('Todos')}
                  className="flex flex-col items-center gap-2 min-w-[72px] group"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                    selectedCategory === 'Todos' 
                      ? 'border-green-600 bg-green-50 scale-110 shadow-md ring-2 ring-green-100' 
                      : 'border-white bg-white group-hover:border-green-200'
                  }`}>
                    <LayoutGrid size={24} className={selectedCategory === 'Todos' ? 'text-green-600' : 'text-gray-400'} />
                  </div>
                  <span className={`text-xs font-semibold transition-colors ${
                    selectedCategory === 'Todos' ? 'text-green-700' : 'text-gray-500'
                  }`}>Todos</span>
                </button>

                {Object.values(Category).map(cat => {
                  const catImage = getCategoryImage(cat);
                  const isSelected = selectedCategory === cat;

                  return (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="flex flex-col items-center gap-2 min-w-[72px] group"
                    >
                      <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-300 shadow-sm flex items-center justify-center bg-white relative ${
                        isSelected 
                          ? 'border-green-600 scale-110 shadow-md ring-2 ring-green-100' 
                          : 'border-white group-hover:border-green-200'
                      }`}>
                        {catImage ? (
                          <img src={catImage} alt={cat} className="w-full h-full object-cover" />
                        ) : (
                          <UtensilsCrossed size={24} className={isSelected ? 'text-green-600' : 'text-gray-400'} />
                        )}
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${
                        isSelected ? 'text-green-700' : 'text-gray-500'
                      }`}>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 flex flex-col h-full">
                  <div className="h-64 overflow-hidden bg-gray-100 relative group">
                     {item.imageUrl ? (
                       <LazyImage 
                         src={item.imageUrl} 
                         alt={item.name} 
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                       />
                     ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                         <ImageOff size={48} className="mb-2 opacity-50" />
                         <span className="text-xs">Sem foto</span>
                       </div>
                     )}
                     
                     <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemShare(item);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-green-700 shadow-md hover:scale-110 transition-all z-20"
                        title="Compartilhar este prato"
                     >
                       <Share2 size={18} />
                     </button>

                     {!item.isAvailable && !isAdminMode && (
                       <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                         <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">Esgotado</span>
                       </div>
                     )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-800 leading-tight">{item.name}</h3>
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full shrink-0 ml-2">
                        {item.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{item.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                      <span className="text-xl font-bold text-green-700">R$ {item.price.toFixed(2)}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        disabled={!item.isAvailable}
                        className={`p-3 rounded-full shadow-md transition-all active:scale-95 flex items-center justify-center ${
                          item.isAvailable 
                            ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title="Adicionar ao carrinho"
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-medium text-gray-600">Nenhum item encontrado</h3>
                <p className="text-gray-500 mt-2">Tente buscar por outro termo ou categoria.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Várzea Alegre Futebol Clube</p>
          <p className="mt-1">Cardápio Oficial para Pedidos Online</p>
        </div>
      </footer>

      {/* Modals */}
      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        clearCart={clearCart}
        whatsappNumber={settings.whatsappNumber}
      />

      {/* Modal de Compartilhamento Personalizado */}
      {isShareModalOpen && currentShareData && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Compartilhar</h3>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-3">
              <button 
                onClick={executeWhatsAppShare}
                className="w-full flex items-center justify-between p-4 bg-green-100 hover:bg-green-200 text-green-800 rounded-xl transition-colors font-semibold group"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="text-green-600 group-hover:scale-110 transition-transform" />
                  <span>Enviar no WhatsApp</span>
                </div>
                <Share2 size={16} className="opacity-50" />
              </button>

              <button 
                onClick={executeCopyLink}
                className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors font-medium relative overflow-hidden"
              >
                <div className="flex items-center gap-3 relative z-10">
                  <Copy className="text-gray-600" />
                  <span>{copyFeedback ? 'Copiado!' : currentShareData.url ? 'Copiar Link' : 'Copiar Texto'}</span>
                </div>
                {copyFeedback && (
                  <div className="absolute inset-0 bg-green-200 opacity-50 transition-opacity"></div>
                )}
              </button>
              
              {!currentShareData.url && (
                <div className="text-xs text-center text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                  <p>✨ <strong>Modo Cartão Digital</strong></p>
                  <p>Como não há site configurado, compartilharemos um texto com o contato direto.</p>
                </div>
              )}

              {currentShareData.url && (
                <div className="text-xs text-center text-gray-400 mt-2 truncate px-4">
                  Link: {currentShareData.url}
                </div>
              )}

              {navigator.share && (
                <button 
                  onClick={executeNativeShare}
                  className="w-full flex items-center justify-center p-3 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Mais opções...
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;