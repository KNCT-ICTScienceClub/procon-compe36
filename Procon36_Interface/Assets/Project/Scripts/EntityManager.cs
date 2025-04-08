using System;
using System.Collections.Generic;
using System.Data;
using TMPro;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.PlayerLoop;
using UnityEngine.Rendering;
using UnityEngine.UIElements;

public class EntityManager : MonoBehaviour
{
    [SerializeField, Range(4, 24)] int fieldSize;
    [SerializeField] Procon procon;
    [SerializeField] GameObject originEntity;
    [SerializeField] GameObject originFrameVertical;
    [SerializeField] GameObject originFrameHorizon;
    [SerializeField] GameObject originTextMesh;
    [SerializeField] GameObject entityParent;
    [SerializeField] GameObject frameParent;
    [SerializeField] GameObject textParent;
    [SerializeField] GameObject selectArea;
    [SerializeField] GameObject mainCamera;
    [SerializeField] GameObject tableFrame;
    [SerializeField] GameObject statusText;
    [SerializeField] bool randomFlag;

    [Serializable]
    class Procon
    {
        public Procon(int size, bool randomFlag)
        {
            if (size % 2 == 1)
            {
                size++;
            }
            problemSize = size;
            MakeProblem(randomFlag);
        }
        public GameObject[,] entity = new GameObject[24, 24];
        public class Frame
        {
            public GameObject[,] vertical = new GameObject[24, 23];
            public GameObject[,] horizon = new GameObject[23, 24];
        }
        public Frame frame = new();
        int[,] initialProblem;
        int[,] problem = new int[24, 24];
        int problemSize;
        public GameObject[,] entityNumber = new GameObject[24, 24];
        List<Order> order = new List<Order>();
        class Order
        {
            public Order(Vector2 vector, int value)
            {
                position = vector;
                size = value;
            }
            public Vector2 position;
            public int size;
        }
        public void Initialization()
        {
            for (int i = 0; i < 24; i++)
            {
                for (int j = 0; j < 24; j++)
                {
                    if (i < problemSize && j < problemSize)
                    {
                        problem[i, j] = initialProblem[i, j];
                    }
                    else
                    {
                        problem[i, j] = 999;
                    }
                }
            }
        }
        void MakeProblem(bool randomFlag)
        {
            initialProblem = new int[problemSize, problemSize];
            int[] array = new int[problemSize * problemSize];
            int count = -1;
            for (int i = 0; i < problemSize * problemSize; i++)
            {
                array[i] = (int)Mathf.Floor((count += 1) / 2);
            }
            if (randomFlag)
            {
                for (int i = 0; i < problemSize * problemSize - 1; i++)
                {
                    int random = UnityEngine.Random.Range(i + 1, problemSize * problemSize);
                    int swap = array[i];
                    array[i] = array[random];
                    array[random] = swap;
                }
                for (int i = 0; i < problemSize; i++)
                {
                    for (int j = 0; j < problemSize; j++)
                    {
                        initialProblem[i, j] = array[i * problemSize + j];
                    }
                }
            }
            Initialization();
        }
        public void Engage(Vector2 position, int size)
        {
            int[,] cell = new int[size, size];
            for (int i = 0; i < size; i++)
            {
                int[] array = new int[size];
                for (int j = 0; j < size; j++)
                {
                    array[j] = problem[(int)position.y + j, (int)position.x + i];
                }
                Array.Reverse(array);
                for (int j = 0; j < size; j++)
                {
                    cell[i, j] = array[j];
                }
            }
            for (int i = 0; i < size; i++)
            {
                for (int j = 0; j < size; j++)
                {
                    problem[(int)position.y + i, (int)position.x + j] = cell[i, j];
                }
            }
            order.Add(new(position, size));
            SetColor();
        }
        public void TurnBack()
        {
            void ReverseEngage(Vector2 position, int size)
            {
                int[,] cell = new int[size, size];
                for (int i = 0; i < size; i++)
                {
                    int[] array = new int[size];
                    for (int j = 0; j < size; j++)
                    {
                        array[j] = problem[(int)position.y + i, (int)position.x + j];
                    }
                    Array.Reverse(array);
                    for (int j = 0; j < size; j++)
                    {
                        cell[i, j] = array[j];
                    }
                }
                for (int i = 0; i < size; i++)
                {
                    for (int j = 0; j < size; j++)
                    {
                        problem[(int)position.y + j, (int)position.x + i] = cell[i, j];
                    }
                }
            }
            ReverseEngage(order[order.Count - 1].position, order[order.Count - 1].size);
            order.RemoveAt(order.Count - 1);
            SetColor();
        }
        public void SetColor()
        {
            for (int i = 0; i < problemSize; i++)
            {
                for (int j = 0; j < problemSize; j++)
                {
                    Renderer renderer = entity[i, j].GetComponent<Renderer>();
                    renderer.material.color = Color.HSVToRGB((float)(problem[i, j] % Mathf.Ceil(problemSize * problemSize / 6)) / (problemSize * problemSize / 6), problem[i, j] < Mathf.Ceil(problemSize * problemSize / 6) ? 0.5f : 1f, problem[i, j] > Mathf.Ceil(problemSize * problemSize / 6) * 2 ? 0.5f : 1f);
                    if (i != problemSize - 1)
                    {
                        frame.horizon[i, j].SetActive(problem[i, j] == problem[i + 1, j]);
                    }
                    if (j != problemSize - 1)
                    {
                        frame.vertical[i, j].SetActive(problem[i, j] == problem[i, j + 1]);
                    }
                    entityNumber[i, j].GetComponent<TextMeshProUGUI>().text = string.Format("{0:000}", problem[i, j]);
                }
            }
        }
        public int MatchCount
        {
            get
            {
                int count = 0;
                foreach (GameObject element in frame.vertical)
                {
                    count += element.activeSelf ? 1 : 0;
                }
                foreach (GameObject element in frame.horizon)
                {
                    count += element.activeSelf ? 1 : 0;
                }
                return count;
            }
        }
        public int turn
        {
            get
            {
                return order.Count;
            }
        }
        [NonSerialized] public Vector2 initialPosition;
        [NonSerialized] public Vector2 initialIndex;
        [NonSerialized] public Vector3 holdArea = Vector3.zero;
        [NonSerialized] public bool holdFlag = false;
        [NonSerialized] public bool initialFlag = false;
        public bool HitFlag
        {
            get
            {
                Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
                RaycastHit hit;
                return Physics.Raycast(ray, out hit) ? hit.collider.gameObject.CompareTag("Entity") : false;
            }
        }
        public Vector2 Position
        {
            get
            {
                Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
                RaycastHit hit;
                return Physics.Raycast(ray, out hit) ? (hit.collider.gameObject.CompareTag("Entity") ? new Vector2(hit.collider.gameObject.transform.position.x, hit.collider.gameObject.transform.position.z) : Vector2.zero) : Vector2.zero;
            }
        }
        public Vector2 Index
        {
            get
            {
                Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
                RaycastHit hit;
                return Physics.Raycast(ray, out hit) ? (hit.collider.gameObject.CompareTag("Entity") ? hit.collider.GetComponent<IndexManager>().index : Vector2.zero) : Vector2.zero;
            }
        }
        public int AreaSize
        {
            get
            {
                int size;
                if (Index.x > Index.y)
                {
                    size = (int)(Index.x - initialIndex.x) + 1;
                    if (initialIndex.y + size >= problemSize)
                    {
                        return problemSize - (int)initialIndex.y;
                    }
                }
                else
                {
                    size = (int)(Index.y - initialIndex.y) + 1;
                    if (initialIndex.x + size >= problemSize)
                    {
                        return problemSize - (int)initialIndex.x;
                    }
                }
                return size;
            }
        }
        public void SetInitial()
        {
            initialPosition = Position;
            initialIndex = Index;
            holdArea = Vector3.zero;
            initialFlag = true;
        }
    }

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        mainCamera.transform.position = new Vector3(-12 + fieldSize / 2, 0.88f * fieldSize + 1.15f, 12 - fieldSize / 2);
        tableFrame.transform.position = new Vector3(-12 + fieldSize / 2, 0f, 12 - fieldSize / 2);
        tableFrame.GetComponent<TableManager>().resizeFrame(fieldSize);
        procon = new(fieldSize, randomFlag);
        for (int i = 0; i < 24; i++)
        {
            for (int j = 0; j < 24; j++)
            {
                procon.entity[i, j] = Instantiate(originEntity, new Vector3(-11.5f + j, 0, 11.5f - i), Quaternion.identity);
                procon.entity[i, j].transform.SetParent(entityParent.transform);
                procon.entity[i, j].SetActive(i < fieldSize && j < fieldSize);
                procon.entity[i, j].GetComponent<IndexManager>().index = new(j, i);
                if (j != 23)
                {
                    procon.frame.vertical[i, j] = Instantiate(originFrameVertical, new Vector3(-11f + j, 0.05f, 11.5f - i), Quaternion.identity);
                    procon.frame.vertical[i, j].transform.SetParent(frameParent.transform);
                    procon.frame.vertical[i, j].SetActive(false);
                }
                if (i != 23)
                {
                    procon.frame.horizon[i, j] = Instantiate(originFrameHorizon, new Vector3(-11.5f + j, 0.05f, 11f - i), Quaternion.identity);
                    procon.frame.horizon[i, j].transform.SetParent(frameParent.transform);
                    procon.frame.horizon[i, j].SetActive(false);
                }
                procon.entityNumber[i, j] = Instantiate(originTextMesh, new Vector3(-11.5f + j, 0.51f, 11.5f - i), Quaternion.Euler(90f, 0f, 0f));
                procon.entityNumber[i, j].transform.SetParent(textParent.transform);
                procon.entityNumber[i, j].SetActive(i < fieldSize && j < fieldSize);
            }
        }
        procon.SetColor();
        statusText.GetComponent<TextMeshProUGUI>().text = string.Format("turn:{0}\nmatch:{1}", procon.turn, procon.MatchCount);
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetMouseButtonDown(0))
        {
            if (!procon.holdFlag)
            {
                if (procon.HitFlag)
                {
                    procon.SetInitial();
                    selectArea.SetActive(true);
                }
            }
            else
            {
                procon.Engage(procon.holdArea, (int)procon.holdArea.z);
                statusText.GetComponent<TextMeshProUGUI>().text = string.Format("turn:{0}\nmatch:{1}", procon.turn, procon.MatchCount);
                selectArea.transform.position = new Vector3(0f, -1f, 0f);
                selectArea.SetActive(false);
                procon.holdFlag = false;
                procon.initialFlag = false;
            }
        }
        if (Input.GetMouseButton(0))
        {
            if (procon.HitFlag && procon.initialFlag)
            {
                if (procon.initialIndex != procon.Index)
                {
                    selectArea.transform.position = new Vector3(procon.initialPosition.x - 0.5f + (float)procon.AreaSize / 2, 0.07f, procon.initialPosition.y + 0.5f - (float)procon.AreaSize / 2);
                    selectArea.GetComponent<AreaManager>().resizeFrame(procon.AreaSize);
                    procon.holdArea = new Vector3(procon.initialIndex.x, procon.initialIndex.y, procon.AreaSize);
                }
            }
        }
        if (Input.GetMouseButtonUp(0))
        {
            if (procon.initialFlag && procon.holdArea != Vector3.zero)
            {
                procon.holdFlag = true;
            }
        }
        if (Input.GetMouseButtonDown(1))
        {
            selectArea.transform.position = new Vector3(0f, -1f, 0f);
            selectArea.SetActive(false);
            procon.holdArea = Vector3.zero;
            procon.holdFlag = false;
            procon.initialFlag = false;
        }
        if (Input.GetKeyDown(KeyCode.R) && !procon.initialFlag && procon.turn != 0)
        {
            procon.TurnBack();
            statusText.GetComponent<TextMeshProUGUI>().text = string.Format("turn:{0}\nmatch:{1}", procon.turn, procon.MatchCount);
            procon.initialFlag = false;
        }
    }
}
