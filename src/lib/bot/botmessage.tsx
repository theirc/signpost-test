import type { SelectProps, TabsProps } from 'antd'
import { Button, Input, Modal, Select } from "antd"
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { FaThumbsDown, FaThumbsUp, FaFlag } from "react-icons/fa"
import { useMultiState } from '..'
import { api } from '../api'
const { TextArea } = Input

export function BotChatMessage(props: { m: ChatMessage, isWaiting: boolean, rebuild: () => void }) {

  let { isWaiting, rebuild, m } = props
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [state, setState] = useMultiState({
    open: false,
    positivie: "fail" as AI_SCORES,
  })

  const showModalPositive = () => {
    setState({ open: true, positivie: "pass" })
  }
  const showModalNegative = () => {
    setState({ open: true, positivie: "fail" })
  }
  const showModalRedFlag = () => {
    setState({ open: true, positivie: "redflag" })
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setState({ open: false, positivie: "fail" })
  }

  const linklist = []

  if (m.docs && m.docs.length) {
    for (const doc of m.docs) {
      linklist.push(
        <div>
          <a href={doc.metadata.source} key={doc.metadata.source} target="_blank" className="font-medium no-underline text-blue-500">
            {doc.metadata.title}
          </a>
        </div>
      )
    }
  }

  return <div>
    <div className="flex">
      <div className="">{m.message}</div>
      {!isWaiting && m.needsRebuild && <Button
        className="mx-2 -mt-1"
        type="primary"
        onClick={rebuild}
        loading={isWaiting}
        disabled={isWaiting}>
        Rebuild
      </Button>}
    </div>
    {m.isAnswer && <div className="text-gray-400 flex gap-2 mt-2">
      <FaThumbsUp className="cursor-pointer" onClick={showModalPositive} />
      <FaThumbsDown className="mt-1 cursor-pointer" onClick={showModalNegative} />
      <FaFlag className="mt-1 cursor-pointer text-red-500" onClick={showModalRedFlag} />
    </div>}
    {linklist.length > 0 && <div className="text-xs mt-4 uppercase">
      <div className="font-medium no-underline">
        <div className="mb-2">References:</div>
        {linklist}
      </div>
    </div>}
    <BotScoreModal m={m} open={state.open} close={handleClose} score={state.positivie} />
  </div>

}


type Inputs = {
  reporter: string
  sfr: string[]
  qmf: string[]
  expectedResult: string
}


const failOptions: SelectProps['options'] = [
  {
    value: "Bias",
    label: "Bias",
  },
  {
    value: "Malicious",
    label: "Malicious",
  },
  {
    value: "Discrimination",
    label: "Discrimination",
  },
  {
    value: "Security Risk",
    label: "Security Risk",
  },
  {
    value: "Privacy",
    label: "Privacy",
  },
  {
    value: "Ethical Concern",
    label: "Ethical Concern",
  },
  {
    value: "Displacement",
    label: "Displacement",
  },
  {
    value: "Social Manipulation",
    label: "Social Manipulation",
  }
]

const qmf: SelectProps['options'] = [
  {
    value: "Trauma Informed",
    label: "Trauma Informed",
  },
  {
    value: "Client Centered",
    label: "Client Centered",
  },
  {
    value: "Safety / Do no Harm",
    label: "Safety / Do no Harm",
  }
]

function BotScoreModal(props: { m: ChatMessage, open: boolean, close: () => void, score?: AI_SCORES }) {

  const { m, open, close, score } = props
  const { botName, id } = m
  const [confirmLoading, setConfirmLoading] = useState(false)
  const { register, handleSubmit, clearErrors, formState: { errors }, trigger, control, resetField } = useForm<Inputs>()

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    await api.qualifyBot(id, score, data.reporter, data.expectedResult, m.question, m.message, data.sfr || [], data.qmf || [])
  }

  const handleOk = async () => {

    setConfirmLoading(true)
    const isOk = await trigger()

    if (isOk) {
      await handleSubmit(onSubmit)()
      setConfirmLoading(false)
      close()
    }

    setConfirmLoading(false)
  }

  const onCloseForm = () => {
    clearErrors()
    resetField("expectedResult")
    resetField("sfr")
  }

  const title = score == "fail" ? "Qualify Negative" : score == "pass" ? "Qualify Positive" : "Red Flag"   //{`${botName} - ${positive ? 'Qualify Positive' : 'Qualify Negative'}`}
  const isFail = score == "fail" || score == "redflag"

  return <Modal
    title={`${botName} - ${title}`}
    open={open}
    onOk={handleOk}
    onCancel={close}
    afterClose={onCloseForm}
    confirmLoading={confirmLoading}
    destroyOnClose>

    <div className='flex flex-col gap-4 p-4'>

      <div >
        <div className='font-medium mb-1'>Reporter</div>
        <Controller
          name="reporter"
          control={control}
          rules={{ required: true }}
          render={({ field }) => <Input {...field} />}
        />
        {errors.reporter && <span className='text-red-500'>This field is required</span>}
      </div>

      {isFail && <div >
        <div className='font-medium mb-1'>Red Team Metrics Flag</div>
        <Controller
          name="sfr"
          control={control}
          render={({ field }) => <Select
            mode="multiple"
            className="w-full"
            placeholder="Please select"
            options={failOptions}
            {...field}
          />
          }
        />
      </div>}

      {isFail && <div >
        <div className='font-medium mb-1'>Quality Metric Flag</div>
        <Controller
          name="qmf"
          control={control}
          render={({ field }) => <Select
            mode="multiple"
            className="w-full"
            placeholder="Please select"
            options={qmf}
            {...field}
          />
          }
        />
      </div>}


      <div>
        <div className='font-medium mb-1'>Comments</div>
        <Controller
          name="expectedResult"
          control={control}
          rules={{ required: true }}
          render={({ field }) => <TextArea {...field} />}
        />
        {errors.expectedResult && <span className='text-red-500'>This field is required</span>}
      </div>


    </div>

  </Modal>

}