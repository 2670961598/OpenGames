<script setup lang="ts">
import { ref } from 'vue'

// 推荐游戏列表
const recommendedGames = ref([
  { id: 1, title: '星际探险', category: '冒险', rating: 4.8, image: '', color: 'primary' },
  { id: 2, title: '魔法世界', category: 'RPG', rating: 4.6, image: '', color: 'secondary' },
  { id: 3, title: '极速赛车', category: '竞速', rating: 4.5, image: '', color: 'accent' },
  { id: 4, title: '策略战争', category: '策略', rating: 4.7, image: '', color: 'positive' },
  { id: 5, title: '解谜大师', category: '益智', rating: 4.4, image: '', color: 'warning' },
  { id: 6, title: '格斗之王', category: '动作', rating: 4.9, image: '', color: 'negative' },
])


const playGame = (gameId: number) => {
  console.log('开始游戏:', gameId)
}
</script>

<template>
  <div class="recommend-view">
    <!-- 推荐内容 -->
    <q-scroll-area class="content-area">
      <div class="q-pa-md">
        <!-- 横幅推荐 -->
        <q-card class="featured-card q-mb-lg" flat>
          <q-img
            src=""
            style="height: 200px"
            class="bg-secondary"
          >
            <div class="absolute-full flex flex-center text-center featured-overlay">
              <div>
                <div class="text-h4 text-weight-bold q-mb-sm">本周精选</div>
                <div class="text-subtitle1 featured-subtitle">发现最热门的独立游戏</div>
                <q-btn
                  color="primary"
                  label="立即体验"
                  class="q-mt-md"
                  rounded
                  unelevated
                />
              </div>
            </div>
          </q-img>
        </q-card>

        <!-- 游戏网格 -->
        <div class="text-h6 text-weight-bold q-mb-md section-title">热门推荐</div>

        <div class="row q-col-gutter-md">
          <div
            v-for="game in recommendedGames"
            :key="game.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card class="game-card" flat bordered>
              <q-img
                :src="game.image"
                style="height: 140px"
                class="bg-secondary"
              >
                <div class="absolute-full flex flex-center game-image-placeholder">
                  <q-icon name="sports_esports" size="48px" />
                </div>
              </q-img>

              <q-card-section class="q-pa-sm">
                <div class="row items-center justify-between q-mb-xs">
                  <div class="text-subtitle2 text-weight-medium ellipsis game-title">
                    {{ game.title }}
                  </div>
                  <q-badge :color="game.color" class="text-caption">
                    {{ game.category }}
                  </q-badge>
                </div>

                <div class="row items-center q-gutter-x-sm">
                  <q-rating
                    :model-value="game.rating"
                    max="5"
                    size="16px"
                    color="warning"
                    readonly
                  />
                  <span class="text-caption rating-text">{{ game.rating }}</span>
                </div>
              </q-card-section>

              <q-card-actions class="q-pa-sm q-pt-none">
                <q-btn
                  flat
                  color="primary"
                  label="开始游戏"
                  size="sm"
                  class="full-width"
                  @click="playGame(game.id)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </q-scroll-area>
  </div>
</template>

<style scoped>
.recommend-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
}

.content-area {
  flex: 1;
  background: var(--color-bg-primary);
}

.featured-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--theme-transition);
}

.featured-overlay {
  background: linear-gradient(135deg, var(--color-bg-secondary), var(--color-bg-tertiary));
  color: var(--color-text-primary);
}

.featured-subtitle {
  color: var(--color-text-secondary);
}

.section-title {
  color: var(--color-text-primary);
}

.game-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: var(--theme-transition);
}

.game-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.game-image-placeholder {
  color: var(--color-text-tertiary);
}

.game-title {
  color: var(--color-text-primary);
}

.rating-text {
  color: var(--color-text-secondary);
}

/* 赛博朋克主题：特色卡片发光效果 */
[data-theme="cyberpunk"] .featured-card {
  border: 1px solid var(--color-accent);
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.15);
}

/* 森林主题：游戏卡片更圆润 */
[data-theme="forest"] .game-card {
  border-radius: var(--radius-lg);
}
</style>
