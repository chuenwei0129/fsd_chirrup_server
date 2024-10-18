import { client } from '@gradio/client'

const app = await client(
  'https://xzjosh-wenjing-bert-vits2.hf.space/--replicas/0d9hq/'
)
const result = await app.predict(0, [
  '我失去九成的视力，还有能发挥出一半的实力；而你失去九成的视力，就成了废人。我确实无法应对你的剑技，但现在，你还知道要何时出剑、朝哪个方向出剑、怎么出剑吗？', // string  in 'Text' Textbox component
  'Wenjing', // string (Option from: [('Wenjing', 'Wenjing')]) in 'Speaker' Dropdown component
  0.2, // number (numeric value between 0.1 and 1) in 'SDP/DP混合比' Slider component
  0.5, // number (numeric value between 0.1 and 1) in '感情调节' Slider component
  0.9, // number (numeric value between 0.1 and 1) in '音素长度' Slider component
  1, // number (numeric value between 0.1 and 2) in '生成长度' Slider component
])

console.log(result.data)

// https://xzjosh-wenjing-bert-vits2.hf.space/--replicas/0d9hq/file=/tmp/gradio/172df8d0a0e704ea1ee30fe3663e0c95f269ff04/audio.wav
