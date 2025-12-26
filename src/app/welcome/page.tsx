'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Yeseva_One } from 'next/font/google'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

export default function WelcomePage() {
    const router = useRouter()

    return (
        <div className="min-h-[100dvh] w-full bg-black text-white p-6 pb-24 overflow-y-auto no-scrollbar">
            <div className="max-w-md mx-auto space-y-8 animate-fade-in">

                {/* Header */}
                <div className="text-center space-y-2 mt-4">
                    <h1 className={`${yesevaOne.className} text-4xl leading-tight`}>
                        Bem-vindo(a) ao <br />
                        <span className="bg-gradient-to-r from-[#ff0800] to-[#ff9900] bg-clip-text text-transparent">
                            Lovanda
                        </span>
                    </h1>
                    <div className="h-1 w-16 bg-gradient-to-r from-[#ff0800] to-[#ff9900] rounded-full mx-auto mt-4"></div>
                </div>

                {/* Intro Text */}
                <p className="text-gray-300 text-center leading-relaxed text-lg">
                    Este é um espaço feito para pessoas que querem conversar, conhecer alguém e construir algo com respeito e boa energia.
                </p>

                <p className="text-center text-gray-400 font-medium">
                    Antes de continuar, fica atento(a) a alguns pontos importantes 👇🏽
                </p>

                {/* Cards Section */}
                <div className="space-y-4">

                    {/* Security Card */}
                    <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#333333] space-y-3 relative overflow-hidden group hover:border-[#ff9900]/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-900/20 text-yellow-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                            </div>
                            <h3 className="font-bold text-lg">Segurança em primeiro lugar</h3>
                        </div>
                        <div className="space-y-2 text-gray-400 text-sm leading-relaxed">
                            <p>
                                De momento, ainda não temos verificação de perfis.
                                Por isso, tem cuidado com perfis que parecem falsos, sem foto ou com comportamentos estranhos.
                            </p>
                            <p className="text-red-400/80">
                                Caso tenhas qualquer problema, podes bloquear ou denunciar usuários diretamente na plataforma. Usa essas opções sempre que achares necessário.
                            </p>
                        </div>
                    </div>

                    {/* Profile Card */}
                    <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#333333] space-y-3 group hover:border-[#ff9900]/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-900/20 text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </div>
                            <h3 className="font-bold text-lg">Completa o teu perfil</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Podes editar e adicionar mais informações na página do teu perfil.
                            Quanto mais completo estiver — fotos, interesses, gostos e uma boa descrição — maiores são as chances de conexões reais e interessantes.
                        </p>
                    </div>

                    {/* Plans Card */}
                    <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#333333] space-y-3 group hover:border-[#ff9900]/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-900/20 text-amber-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </div>
                            <h3 className="font-bold text-lg">Sobre os planos</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            A plataforma possui planos pagos com benefícios extras.
                            Nada é obrigatório, mas avisamos desde já para não seres surpreendido(a) mais à frente.
                        </p>
                    </div>

                    {/* Tip Card */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#262626] border border-[#ff9900]/30 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff9900]/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="p-2 rounded-lg bg-gray-800 text-white border border-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                            </div>
                            <h3 className="font-bold text-lg">Dica importante</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed relative z-10">
                            Para uma melhor experiência, recomendamos que adiciones o site à tela inicial do teu telemóvel. Assim o acesso fica mais rápido e prático.
                        </p>
                    </div>

                </div>

                {/* Footer Text */}
                <div className="text-center pt-4">
                    <p className="text-xl font-medium text-white mb-2">Agora é contigo 👇🏽</p>
                    <p className="text-gray-400">Explora com calma e aproveita.</p>
                </div>

            </div>

            {/* Sticky Bottom Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-20">
                <div className="max-w-md mx-auto flex flex-col gap-3">
                    <button
                        onClick={() => router.push('/plans')}
                        className="w-full py-4 rounded-full bg-[#1A1A1A] text-gray-300 font-bold text-lg border border-[#333333] hover:bg-[#262626] hover:text-white transition-all active:scale-[0.98]"
                    >
                        Ver Planos
                    </button>
                    <Link
                        href="/profile"
                        className="w-full py-4 rounded-full bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-lg shadow-lg shadow-orange-900/20 hover:shadow-orange-900/40 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center text-center"
                    >
                        Continuar
                    </Link>
                </div>
            </div>
        </div>
    )
}
