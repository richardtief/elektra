import { createWidget } from "widget"
import App from "./application"

createWidget(__dirname).then((widget) => {
  widget.setPolicy()
  widget.render(App)
})
