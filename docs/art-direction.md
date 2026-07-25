# TypeRift v1 艺术与体验规范

## 原则来源

TypeRift 将 Apple Human Interface Guidelines 当作质量基线，而不是界面模板。2026 年更新的 [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles) 强调 Purpose、Agency、Responsibility、Familiarity、Flexibility、Simplicity、Craft 与 Delight；项目分别落实为单主操作、可暂停/撤离、隐私最小化、熟悉控件、多输入与无障碍、清晰层级、细节审计和与动作直接相关的反馈。

[Materials](https://developer.apple.com/design/human-interface-guidelines/materials) 将 Liquid Glass 定义为控制与导航的功能层，并明确建议不要在内容层使用、对自定义控件要克制。TypeRift 因此只在全局导航、HUD、关键操作、暂停菜单和 Sheet 使用玻璃；大厅内容卡片、战场背景和档案内容使用标准实色材质。`backdrop-filter` 不可用、减少透明度或增强对比度时全部回退为不透明表面。

[Motion](https://developer.apple.com/design/human-interface-guidelines/motion) 要求动效有目的、简短准确、可取消且不能成为唯一反馈。界面反馈限制在 120–320ms；减少动态时移除位移、缩放、持续漂浮与粒子，只保留淡入和静态高亮。战斗信息始终同时具有文字、形状或进度变化。

[Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) 建议支持至少 200% 文字、满足 WCAG AA、避免只用颜色表达状态并描述屏幕内容。项目正文基线为 17px，触控目标至少 44×44px，并支持屏幕阅读器目标队列、键盘导航、增强对比度、色觉安全、无闪烁和反应时间辅助。

## 视觉语言

- 情绪：静谧、精确、克制的深空科幻；危险来自压力与断裂，而非血腥或噪声。
- 层级：内容优先；导航和瞬时控制浮在内容上方；玻璃从不堆叠。
- 色彩：语义 token 同时定义浅色与深色；战场使用青蓝主信号、紫色构筑、琥珀首领与非单一颜色的危险反馈。
- 字体：系统字体栈，不下载或冒用 SF 字体；代码与词条使用系统等宽字体栈。
- 图标：应用控制统一使用 Lucide；游戏内容使用原创位图图标；不使用 SF Symbols 文件。
- 圆角：小控件 10px、卡片 16–24px、场景 32px、胶囊控件 999px，全部由语义 token 驱动。

## 资产规范

首发内容固定为 3 个 1920×1080 区域背景、9 个 384×384 透明敌人、3 个 512×512 透明首领和 24 个 192×192 透明升级图标。角色必须完整、无烘焙文字、无黑框、无场景底板。`apps/web/public/game/v1/manifest.json` 是唯一资产目录，包含内容版本、路径、尺寸、SHA-256、sRGB 色域和无障碍 label key。

非游戏首屏不引用战场位图；只有 `/play` 的区域背景和 Canvas 精灵加载器会请求它们。
