import React from 'react'
import { Link } from '@tanstack/react-router'
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#140D0A] font-mono text-xs text-[#CFB28C]">
      {/* 1. Top Subfooter Bar matching Figma */}
      <div className="bg-[#241612] border-t  py-6">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <span className="text-base font-bold tracking-widest text-[#F5F1EB]">
              KURIO
            </span>
            <span className="text-xs text-[#CFB28C] leading-snug">
              Feito para colecionadores,<br className="hidden sm:inline" /> criadores e cultura
            </span>
            <span className="text-xs text-[#CFB28C]">
              contato@email.com
            </span>
            <span className="text-xs text-[#CFB28C]">
              +55 11 4002 8922
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation Columns */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 ">
          {/* Col 1: Meu perfil */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#F5F1EB]">Meu perfil</h4>
            <ul className="space-y-2.5 text-xs text-[#CFB28C]">
              <li><Link to="/profile" className="hover:text-[#D28A4C] transition-colors">Meu perfil</Link></li>
              <li><a href="#colecao" className="hover:text-[#D28A4C] transition-colors">Minha coleção</a></li>
              <li><a href="#atividade" className="hover:text-[#D28A4C] transition-colors">Atividade</a></li>
              <li><a href="#estudio" className="hover:text-[#D28A4C] transition-colors">Estúdio do criador</a></li>
              <li><a href="#interesse" className="hover:text-[#D28A4C] transition-colors">Lista de interesse</a></li>
            </ul>
          </div>

          {/* Col 2: Central de ajuda */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#F5F1EB]">Central de ajuda</h4>
            <ul className="space-y-2.5 text-xs text-[#CFB28C]">
              <li><a href="#ajuda" className="hover:text-[#D28A4C] transition-colors">Central de ajuda</a></li>
              <li><a href="#comprar" className="hover:text-[#D28A4C] transition-colors">Como comprar NFTs</a></li>
              <li><a href="#seguranca" className="hover:text-[#D28A4C] transition-colors">Carteira e segurança</a></li>
              <li><a href="#politica" className="hover:text-[#D28A4C] transition-colors">Política do mercado</a></li>
              <li><a href="#denunciar" className="hover:text-[#D28A4C] transition-colors">Denunciar item</a></li>
            </ul>
          </div>

          {/* Col 3: Coleções */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#F5F1EB]">Coleções</h4>
            <ul className="space-y-2.5 text-xs text-[#CFB28C]">
              <li><a href="/?category=art#catalogo" className="hover:text-[#D28A4C] transition-colors">Arte digital</a></li>
              <li><a href="/?category=photography#catalogo" className="hover:text-[#D28A4C] transition-colors">Fotografia</a></li>
              <li><a href="/?category=music#catalogo" className="hover:text-[#D28A4C] transition-colors">Música</a></li>
              <li><a href="/?category=3d#catalogo" className="hover:text-[#D28A4C] transition-colors">Arte 3D</a></li>
              <li><a href="/?category=utility#catalogo" className="hover:text-[#D28A4C] transition-colors">Utilidade</a></li>
            </ul>
          </div>

          {/* Col 4: Redes sociais e Carteiras compatíveis */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#F5F1EB]">Redes sociais</h4>
              <div className="flex items-center gap-3 text-[#CFB28C]">
                <a href="#facebook" className="p-1.5 rounded bg-[#241612] hover:text-[#D28A4C] transition-colors" aria-label="Facebook">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#instagram" className="p-1.5 rounded bg-[#241612] hover:text-[#D28A4C] transition-colors" aria-label="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#twitter" className="p-1.5 rounded bg-[#241612] hover:text-[#D28A4C] transition-colors" aria-label="Twitter">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#linkedin" className="p-1.5 rounded bg-[#241612] hover:text-[#D28A4C] transition-colors" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#youtube" className="p-1.5 rounded bg-[#241612] hover:text-[#D28A4C] transition-colors" aria-label="YouTube">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#F5F1EB] uppercase tracking-wider">Carteiras compatíveis</h4>
              <div className="px-3 py-2 rounded bg-[#241612] border border-[#3D251C] text-[10px] text-[#D28A4C] tracking-widest text-center font-bold">
                METAMASK &bull; WALLETCONNECT &bull; COINBASE
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Copyright */}
        <div className="pt-8 text-center text-[11px] text-[#8C7760]">
          &copy; 2026 Kurio. Propriedade digital para todos.
        </div>
      </div>
    </footer>
  )
}
