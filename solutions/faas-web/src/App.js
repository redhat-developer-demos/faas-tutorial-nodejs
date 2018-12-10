import React, { Component } from 'react'
import                           './App.css'
import axios                from 'axios'

class App extends Component {
  constructor(props) {
    super(props)
    this.renderForm = this.renderForm.bind(this)
    this.queryFaas = this.queryFaas.bind(this)
  }
  queryFaas() {
    
    const data = {
      text: this._newText.value
    }
    
    this._newText.value = ''

    const uri = process.env.REACT_APP_WEB_URL

    axios.post(uri, {data})
    .then(res => {
      document.getElementById('outputArea').innerHTML = res.data.response.data.text
    }).catch(function (error) {
      document.getElementById('outputArea').innerHTML = error
    })
  }

  renderForm() {
    return (
      <div className="App">
        <header className="App-header">
        <h1>Hello-Web</h1>
          <p>
            Enter some text, then click Submit to see the function work
          </p>
          <p>
          <div>
            <input className="App-input" ref={input => this._newText = input} />
          </div>
          </p>
          <span>
            <button className="App-submit" onClick={this.queryFaas}>Submit</button>
          </span>
          <p>
            <div id='outputArea'>(Output will be displayed here)</div>
          </p>
        </header>
      </div>
    );
  }
  render() {
    return this.renderForm()
  }
}

export default App;
