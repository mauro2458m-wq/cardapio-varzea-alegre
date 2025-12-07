import React, { useState } from 'react';
import { Category, MenuItem, AppSettings } from '../types';
import { generateEnhancedDescription } from '../services/geminiService';
import { Plus, Sparkles, Trash2, Edit2, Save, X, Image as ImageIcon, Upload, Loader2, AlertTriangle, Settings, Phone, Globe } from 'lucide-react';

interface AdminPanelProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onClose: () => void;
}

// Função auxiliar para comprimir imagem
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024; // Aumentei um pouco a largura máxima para melhor qualidade
        const scaleSize = MAX_WIDTH / img.width;
        
        // Se a imagem for menor que o limite, mantém o tamanho original
        if (scaleSize >= 1) {
             canvas.width = img.width;
             canvas.height = img.height;
        } else {
             canvas.width = MAX_WIDTH;
             canvas.height = img.height * scaleSize;
        }

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Comprime para JPEG com qualidade 0.85 (85%) - Melhor visualização
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (error) => reject(error);
  });
};

const AdminPanel: React.FC<AdminPanelProps> = ({ menuItems, setMenuItems, settings, setSettings, onClose }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'settings'>('menu');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: Category.LANCHES,
    imageUrl: '',
    isAvailable: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  // Estado para controlar o modal de exclusão
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: Category.LANCHES,
      imageUrl: '',
      isAvailable: true
    });
    setEditingId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isAvailable: e.target.checked }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({ ...prev, imageUrl: compressedBase64 }));
      } catch (error) {
        console.error("Erro ao processar imagem", error);
        alert("Erro ao processar a imagem. Tente outra.");
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) return;
    setIsGenerating(true);
    const enhanced = await generateEnhancedDescription(formData.name || '', formData.description || 'Ingredientes padrões');
    setFormData(prev => ({ ...prev, description: enhanced }));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    if (editingId) {
      setMenuItems(prev => prev.map(item => item.id === editingId ? { ...item, ...formData } as MenuItem : item));
    } else {
      const newItem: MenuItem = {
        id: Date.now().toString(),
        ...formData
      } as MenuItem;
      setMenuItems(prev => [...prev, newItem]);
    }
    resetForm();
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setFormData(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const initiateDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setMenuItems(prev => prev.filter(item => item.id !== itemToDelete));
      if (editingId === itemToDelete) resetForm();
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setItemToDelete(null);
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // Verifica se a imagem é base64 (vem da galeria)
  const isBase64Image = formData.imageUrl?.startsWith('data:');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Painel Administrativo</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button 
          className={`py-2 px-4 font-semibold ${activeTab === 'menu' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
          onClick={() => setActiveTab('menu')}
        >
          Gerenciar Cardápio
        </button>
        <button 
          className={`py-2 px-4 font-semibold flex items-center gap-2 ${activeTab === 'settings' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          Configurações
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-2">Configurações do App</h3>
            <p className="text-sm text-blue-700">
              Aqui você define para onde os pedidos serão enviados e qual link será compartilhado com seus clientes.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone size={18} className="text-green-600" />
                Número do WhatsApp (Pedidos)
              </label>
              <input 
                type="text" 
                name="whatsappNumber" 
                value={settings.whatsappNumber} 
                onChange={handleSettingsChange}
                className="block w-full border rounded-md p-3 shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="Ex: 5581999999999"
              />
              <p className="text-xs text-gray-500 mt-1">Digite apenas números, com código do país (55) e DDD.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Globe size={18} className="text-blue-600" />
                Link Oficial do Cardápio (Compartilhamento)
              </label>
              <input 
                type="text" 
                name="shareUrl" 
                value={settings.shareUrl} 
                onChange={handleSettingsChange}
                className="block w-full border rounded-md p-3 shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="Ex: https://meu-cardapio.com.br"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cole aqui o link final onde seu cardápio está hospedado. Se deixar em branco, o app usará o link atual do navegador (que pode ser temporário).
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-yellow-800 font-semibold flex items-center gap-2">
              <AlertTriangle size={18} />
              Importante
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              As configurações são salvas automaticamente no seu dispositivo.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3">{editingId ? 'Editar Prato' : 'Adicionar Novo Prato'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Prato</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                <input 
                  type="number" 
                  step="0.10"
                  name="price" 
                  value={formData.price} 
                  onChange={handleInputChange} 
                  className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange} 
                  className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring-green-500 focus:border-green-500"
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {/* Seção de Imagem Atualizada */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Imagem do Prato</label>
                <div className="mt-1 space-y-3">
                  {/* Preview da Imagem - AUMENTADO */}
                  {formData.imageUrl && (
                    <div className="relative w-full h-64 bg-gray-200 rounded-md overflow-hidden group border border-gray-300">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-md opacity-90 hover:opacity-100 hover:scale-110 transition-all"
                        title="Remover imagem"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {/* Botão de Upload da Galeria */}
                    <label className={`flex-1 flex flex-col items-center justify-center px-4 py-3 bg-white text-green-700 rounded-lg shadow-sm border border-green-600 cursor-pointer hover:bg-green-50 transition-colors ${isProcessingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center gap-2">
                          {isProcessingImage ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                          <span className="text-sm font-bold">{isProcessingImage ? 'Processando...' : 'Carregar da Galeria'}</span>
                        </div>
                        <input type='file' className="hidden" accept="image/*" onChange={handleFileChange} disabled={isProcessingImage} />
                    </label>

                    {/* Input de URL (Opcional) */}
                    <div className="flex-[2] relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <ImageIcon size={18} />
                      </div>
                      <input 
                        type="text" 
                        name="imageUrl" 
                        value={isBase64Image ? '' : formData.imageUrl || ''} 
                        onChange={handleInputChange} 
                        placeholder={isBase64Image ? "Imagem carregada" : "Ou cole link da web"}
                        disabled={isBase64Image}
                        className="block w-full h-full pl-10 border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <div className="flex gap-2">
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    className="flex-1 block w-full border rounded-md p-2 shadow-sm focus:ring-green-500 focus:border-green-500"
                    rows={2}
                    placeholder="Ingredientes e detalhes..."
                  />
                  <button 
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || !formData.name}
                    className={`px-3 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2 hover:bg-purple-700 transition ${isGenerating ? 'opacity-50' : ''}`}
                    title="Melhorar descrição com IA"
                  >
                    <Sparkles size={18} />
                    {isGenerating ? '...' : 'IA'}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2 flex items-center">
                <input 
                  type="checkbox" 
                  name="isAvailable" 
                  checked={formData.isAvailable} 
                  onChange={handleCheckboxChange} 
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label className="ml-2 block text-sm text-gray-900">Disponível para venda</label>
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              {editingId && (
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                  Cancelar
                </button>
              )}
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                {editingId ? <Save size={18}/> : <Plus size={18}/>}
                {editingId ? 'Salvar Alterações' : 'Adicionar Prato'}
              </button>
            </div>
          </form>

          {/* List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cat.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-full object-cover mr-3 border" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-gray-400">
                            <ImageIcon size={16} />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2 items-center h-full pt-6">
                      <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900"><Edit2 size={18}/></button>
                      <button onClick={() => initiateDelete(item.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
                {menuItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Nenhum item cadastrado. Use o formulário acima para adicionar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-3 rounded-full mb-4 text-red-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Item?</h3>
              <p className="text-gray-500 mb-6">
                Tem certeza que deseja excluir este prato do cardápio? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;