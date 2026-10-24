import { test, expect } from '@playwright/test'

test.describe('NFT Marketplace E2E Evaluation Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage and wait for network/MSW to be ready
    await page.goto('/')
    await expect(page.locator('text=KURIO').first()).toBeVisible()
  })

  test('1. Catálogo: busca, filtros, ordenação e sincronização com URL', async ({ page }) => {
    // Check initial NFTs are loaded
    await expect(page.locator('text=Emerald Ape #042').first()).toBeVisible()

    // Test search via header
    await page.click('button[aria-label="Abrir busca"]')
    const searchInput = page.locator('input#header-search')
    await searchInput.fill('Emerald')
    await searchInput.press('Enter')

    // URL should reflect search query
    await expect(page).toHaveURL(/search=Emerald/)
    await expect(page.locator('text=Emerald Ape #042').first()).toBeVisible()

    // Select category filter
    await page.click('button:has-text("Arte digital")')
    await expect(page).toHaveURL(/category=art/)

    // Select sorting
    const sortSelect = page.locator('select[aria-label="Critério de ordenação"]')
    await sortSelect.selectOption('price_desc')
    await expect(page).toHaveURL(/sortBy=price_desc/)
  })

  test('2. Detalhe do NFT e tratamento de recurso inexistente (404)', async ({ page }) => {
    // Direct access to existing NFT
    await page.goto('/nft/nft-042')
    await expect(page.locator('h1').filter({ hasText: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.locator('text=1.19 ETH').first()).toBeVisible()

    // Direct access to nonexistent NFT
    await page.goto('/nft/nft-inexistente-999')
    await expect(page.locator('text=NFT Não Encontrado')).toBeVisible()
    await expect(page.locator('text=Voltar ao Catálogo')).toBeVisible()
  })

  test('3. Sessão e Autenticação: Login, isolamento de dados e logout', async ({ page }) => {
    // Open login modal
    await page.click('button:has-text("Entrar")')
    await expect(page.locator('role=dialog')).toBeVisible()

    // Quick fill Alex Mercer
    await page.click('button:has-text("Alex")')
    await page.click('button[type="submit"]:has-text("Entrar")')

    // Verify authenticated user in header
    await expect(page.locator('button[aria-label="Menu do usuário"]')).toBeVisible()

    // Refresh page to verify session persistence
    await page.reload()
    await expect(page.locator('button[aria-label="Menu do usuário"]')).toBeVisible()

    // Logout
    await page.click('button[aria-label="Menu do usuário"]')
    await page.click('button:has-text("Sair")')
    await expect(page.locator('button:has-text("Entrar")')).toBeVisible()
  })

  test('4. Carrinho: adição, alteração de quantidade, cupom e resumo financeiro', async ({ page }) => {
    // Navigate to NFT detail and add to cart
    await page.goto('/nft/nft-042')
    await page.click('button:has-text("COMPRAR")')

    // Should redirect to /cart
    await expect(page).toHaveURL(/\/cart/)
    await expect(page.locator('text=Emerald Ape #042').first()).toBeVisible()

    // Apply valid coupon
    const couponInput = page.locator('input[placeholder*="código promocional"]')
    await couponInput.fill('WELCOME10')
    await page.click('button:has-text("Aplicar")')
    await expect(page.locator('text=Cupom ativo: WELCOME10')).toBeVisible()

    // Remove coupon
    await page.click('button:has-text("Remover")')
    await expect(page.locator('text=Cupom ativo: WELCOME10')).not.toBeVisible()
  })

  test('5. Fluxo de Compra Completo: do carrinho ao recibo confirmado', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Entrar")')
    await page.click('button:has-text("Alex")')
    await page.click('button[type="submit"]:has-text("Entrar")')
    await expect(page.locator('button[aria-label="Menu do usuário"]')).toBeVisible()

    // Add item to cart
    await page.goto('/nft/nft-042')
    await page.click('button:has-text("COMPRAR")')

    // Proceed to checkout
    await expect(page).toHaveURL(/\/cart/)
    await page.click('button:has-text("Conectar e finalizar")')
    await expect(page).toHaveURL(/\/checkout/)

    // Submit order
    await page.click('button:has-text("Confirmar compra")')

    // Should arrive on Order Confirmation page with immutable receipt
    await expect(page).toHaveURL(/\/order\//)
    await expect(page.locator('text=Detalhes da transação')).toBeVisible()
    await expect(page.locator('text=Emerald Ape #042').first()).toBeVisible()
  })
})
