/**
 * FilterTabs - Componente de abas de filtro
 * 
 * Props:
 *  - tabs: array<string> (obrigatório) - Array com os nomes das abas
 *  - activeTab: string (obrigatório) - Nome da aba ativa
 *  - onTabChange: function (obrigatório) - Callback quando aba é clicada
 */

import './FilterTabs.css';

export default function FilterTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="filter-tabs">
      {/* Mapeamos cada aba e renderizamos um botão */}
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`filter-tabs__button ${
            activeTab === tab ? 'is-active' : ''
          }`}
          onClick={() => onTabChange(tab)}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}